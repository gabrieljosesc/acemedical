"use client";

import { useEffect, useRef } from "react";

// Google Places address autocomplete, gated on NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
// Without a key this renders as a plain text input — no script is loaded.

export type AutocompletedAddress = {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type PlacesAutocomplete = {
  addListener: (event: "place_changed", handler: () => void) => void;
  getPlace: () => {
    address_components?: { long_name: string; short_name: string; types: string[] }[];
  };
};

type GoogleMaps = {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        options: { types: string[]; componentRestrictions?: { country: string[] }; fields: string[] }
      ) => PlacesAutocomplete;
    };
    event: { clearInstanceListeners: (instance: object) => void };
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
    __acePlacesLoader?: Promise<GoogleMaps>;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadPlaces(): Promise<GoogleMaps> {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (!window.__acePlacesLoader) {
    window.__acePlacesLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.onload = () => {
        if (window.google?.maps?.places) resolve(window.google);
        else reject(new Error("Google Places failed to initialise"));
      };
      script.onerror = () => reject(new Error("Google Places script failed to load"));
      document.head.appendChild(script);
    });
  }
  return window.__acePlacesLoader;
}

function parseAddress(
  components: { long_name: string; short_name: string; types: string[] }[]
): AutocompletedAddress {
  const get = (type: string, short = false) => {
    const c = components.find((x) => x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : "";
  };
  const streetNumber = get("street_number");
  const route = get("route");
  return {
    line1: [streetNumber, route].filter(Boolean).join(" "),
    city: get("locality") || get("sublocality") || get("postal_town"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
    country: get("country", true) || "US",
  };
}

export default function AddressAutocompleteInput({
  label,
  value,
  onChange,
  onAddressSelect,
  required,
  span2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AutocompletedAddress) => void;
  required?: boolean;
  span2?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef(onAddressSelect);
  const changeRef = useRef(onChange);

  useEffect(() => {
    selectRef.current = onAddressSelect;
    changeRef.current = onChange;
  });

  useEffect(() => {
    if (!API_KEY || !inputRef.current) return;
    let autocomplete: PlacesAutocomplete | null = null;
    let cancelled = false;

    loadPlaces()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: ["us", "ca"] },
          fields: ["address_components"],
        });
        autocomplete.addListener("place_changed", () => {
          const components = autocomplete?.getPlace().address_components;
          if (!components) return;
          const parsed = parseAddress(components);
          changeRef.current(parsed.line1);
          selectRef.current(parsed);
        });
      })
      .catch(() => {
        // Autocomplete is a progressive enhancement — a load failure
        // silently leaves the plain input in place.
      });

    return () => {
      cancelled = true;
      if (autocomplete && window.google) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <label className={`flex flex-col gap-1.5 ${span2 ? "sm:col-span-2" : ""}`}>
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <input
        ref={inputRef}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={API_KEY ? "Start typing your address…" : undefined}
        autoComplete="address-line1"
        className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
      />
    </label>
  );
}
