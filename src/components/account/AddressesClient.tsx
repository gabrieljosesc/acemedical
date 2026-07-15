"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInput,
} from "@/app/actions/account";
import { FormField } from "@/components/forms/FormField";

type SavedAddress = {
  id: string;
  label: string | null;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean;
};

const EMPTY: AddressInput = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

export default function AddressesClient({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setShowEditor(true);
  }

  function openEdit(address: SavedAddress) {
    setEditing(address);
    setShowEditor(true);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this address?")) return;
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.ok) {
        toast.success("Address deleted");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultAddress(id);
      if (result.ok) {
        toast.success("Default address updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif font-medium text-[28px] tracking-tight">Addresses</h1>
          <p className="text-[14px] text-ink-soft mt-1">
            Delivery addresses for your orders. The default is prefilled at checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showEditor ? setShowEditor(false) : openCreate())}
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4 py-2.5 hover:bg-teal-deep transition-colors"
        >
          {showEditor ? <X size={15} /> : <Plus size={15} />}
          {showEditor ? "Cancel" : "Add address"}
        </button>
      </div>

      {showEditor && (
        <AddressEditor
          key={editing?.id ?? "new"}
          editing={editing}
          onDone={() => {
            setShowEditor(false);
            setEditing(null);
          }}
        />
      )}

      <div className="flex flex-col gap-3 mt-6">
        {addresses.length === 0 && !showEditor && (
          <div className="text-center py-16 border border-dashed border-line rounded-[4px]">
            <MapPin size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-[14.5px] font-medium text-ink">No saved addresses yet</p>
            <p className="text-[13px] text-ink-soft mt-1">Add one to speed up checkout.</p>
          </div>
        )}

        {addresses.map((address) => (
          <div key={address.id} className="bg-card border border-line rounded-[4px] p-4 flex gap-4">
            <div className="w-10 h-10 rounded-sm bg-teal-tint text-teal flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] font-medium text-ink">{address.recipient_name}</p>
                {address.is_default && (
                  <span className="font-mono text-[10px] tracking-wide px-2.5 py-0.5 rounded-full bg-stock-bg text-stock">
                    Default
                  </span>
                )}
                {address.label && (
                  <span className="font-mono text-[10px] tracking-wide px-2.5 py-0.5 rounded-full bg-teal-tint text-teal">
                    {address.label}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-ink-soft mt-1">
                {[address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {address.phone && <p className="text-[12.5px] text-ink-faint mt-0.5">{address.phone}</p>}
              <div className="flex gap-4 mt-2.5">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className="text-[12.5px] text-teal hover:underline"
                >
                  Edit
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={pending}
                    className="text-[12.5px] text-teal hover:underline disabled:opacity-60"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={pending}
                  className="text-[12.5px] text-low hover:underline disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddressEditor({ editing, onDone }: { editing: SavedAddress | null; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<AddressInput>(
    editing
      ? {
          label: editing.label ?? "",
          recipientName: editing.recipient_name,
          phone: editing.phone ?? "",
          line1: editing.line1,
          line2: editing.line2 ?? "",
          city: editing.city ?? "",
          state: editing.state ?? "",
          postalCode: editing.postal_code ?? "",
          country: editing.country ?? "",
          isDefault: editing.is_default,
        }
      : EMPTY
  );
  const [pending, startTransition] = useTransition();

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = editing ? await updateAddress(editing.id, form) : await createAddress(form);
      if (result.ok) {
        toast.success(editing ? "Address updated" : "Address saved");
        onDone();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line rounded-[4px] p-5 mt-5 flex flex-col gap-3">
      <h2 className="eyebrow">{editing ? "Edit address" : "New address"}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Label" value={form.label ?? ""} onChange={(e) => update("label", e.target.value)} placeholder="e.g. Clinic, Warehouse" />
        <FormField label="Recipient name" required value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} />
        <FormField label="Street address" required value={form.line1} onChange={(e) => update("line1", e.target.value)} span2 />
        <FormField label="Apt / suite / unit" value={form.line2 ?? ""} onChange={(e) => update("line2", e.target.value)} span2 />
        <FormField label="City" required value={form.city} onChange={(e) => update("city", e.target.value)} />
        <FormField label="State / province" required value={form.state} onChange={(e) => update("state", e.target.value)} />
        <FormField label="ZIP / postal code" required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
        <FormField label="Country" required value={form.country} onChange={(e) => update("country", e.target.value)} />
        <FormField label="Phone" type="tel" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => update("isDefault", e.target.checked)}
          className="h-4 w-4 accent-teal"
        />
        <span className="text-[13px] text-ink-soft">Set as default address</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : editing ? "Update address" : "Save address"}
      </button>
    </form>
  );
}
