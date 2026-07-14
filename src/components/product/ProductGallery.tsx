"use client";

import { useState } from "react";
import Image from "next/image";
import ProductVisual from "@/components/product/ProductVisual";

export default function ProductGallery({
  images,
  name,
  categoryLabel,
}: {
  images: string[];
  name: string;
  categoryLabel: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <ProductVisual categoryLabel={categoryLabel} />;
  }

  return (
    <div>
      <div className="bg-card border border-line-strong rounded-[4px] aspect-[4/5] relative overflow-hidden bg-gradient-to-b from-teal-tint to-transparent">
        <span className="absolute top-4 left-4 eyebrow z-10">{categoryLabel}</span>
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-contain p-8"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative w-16 h-16 rounded-sm border overflow-hidden shrink-0 transition-colors ${
                active === i ? "border-teal" : "border-line hover:border-line-strong"
              }`}
            >
              <Image src={url} alt="" fill className="object-contain p-1.5 bg-card" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
