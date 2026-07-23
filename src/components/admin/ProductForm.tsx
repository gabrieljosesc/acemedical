"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  saveProduct,
  createProduct,
  deleteProduct,
  uploadProductImage,
  uploadProductCoa,
  type ProductFormInput,
} from "@/app/actions/admin-products";
import { FormField, FormSelect, FormSection } from "@/components/forms/FormField";

type Option = { id: string; name: string };
type Tier = { minQ: string; maxQ: string; price: string };

export default function ProductForm({
  productId,
  initial,
  categories,
  brands,
}: {
  productId: string | null; // null = create
  initial: ProductFormInput;
  categories: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const coaRef = useRef<HTMLInputElement>(null);
  const extraCoaRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    ...initial,
    stockQuantity: initial.stockQuantity === null ? "" : String(initial.stockQuantity),
    price: String(initial.price),
  });
  const [tiers, setTiers] = useState<Tier[]>(
    initial.priceTiers.map((t) => ({ minQ: String(t.minQ), maxQ: String(t.maxQ), price: String(t.price) }))
  );
  const [images, setImages] = useState<string[]>(initial.images);
  const [coaUrl, setCoaUrl] = useState<string | null>(initial.coaUrl);
  const [additionalCoas, setAdditionalCoas] = useState(initial.additionalCoas);
  const [newCoaLabel, setNewCoaLabel] = useState("");
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildInput(): ProductFormInput {
    return {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      price: Number(form.price) || 0,
      priceTiers: tiers
        .map((t) => ({ minQ: Number(t.minQ), maxQ: Number(t.maxQ), price: Number(t.price) }))
        .filter((t) => t.minQ > 0 && t.maxQ >= t.minQ && t.price > 0),
      stockQuantity: form.stockQuantity === "" ? null : Number(form.stockQuantity),
      isInStock: form.isInStock,
      featured: form.featured,
      categoryId: form.categoryId,
      brandId: form.brandId,
      description: form.description,
      images,
      coaUrl,
      additionalCoas,
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = buildInput();
      const result = productId ? await saveProduct(productId, input) : await createProduct(input);
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        if (!productId && result.id) {
          router.push(`/admin/products/${result.id}`);
        }
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    if (!productId || !window.confirm("Delete this product? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.ok) {
        toast.success(result.message ?? "Deleted");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image file first.");
      return;
    }
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadProductImage(formData);
      if (result.ok && result.message) {
        setImages((prev) => [...prev, result.message!]);
        if (fileRef.current) fileRef.current.value = "";
        toast.success("Image uploaded — save the product to apply.");
      } else if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

  function handleCoaUpload() {
    const file = coaRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a PDF file first.");
      return;
    }
    const formData = new FormData();
    formData.set("coa", file);
    startTransition(async () => {
      const result = await uploadProductCoa(formData);
      if (result.ok && result.message) {
        setCoaUrl(result.message);
        if (coaRef.current) coaRef.current.value = "";
        toast.success("COA uploaded — save the product to apply.");
      } else if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

  function handleExtraCoaUpload() {
    const file = extraCoaRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a PDF file first.");
      return;
    }
    if (!newCoaLabel.trim()) {
      toast.error("Give this certificate a label first (e.g. \"Lot #4471\").");
      return;
    }
    const formData = new FormData();
    formData.set("coa", file);
    startTransition(async () => {
      const result = await uploadProductCoa(formData);
      if (result.ok && result.message) {
        setAdditionalCoas((prev) => [...prev, { label: newCoaLabel.trim(), url: result.message! }]);
        setNewCoaLabel("");
        if (extraCoaRef.current) extraCoaRef.current.value = "";
        toast.success("Certificate uploaded — save the product to apply.");
      } else if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="flex flex-col gap-5">
        <FormSection title="Basics">
          <FormField label="Name" required value={form.name} onChange={(e) => set("name", e.target.value)} span2 />
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Slug (URL)" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from name" />
            <FormField label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormSelect label="Category" value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="Brand" value={form.brandId ?? ""} onChange={(e) => set("brandId", e.target.value || null)}>
              <option value="">— none —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
            />
          </label>
        </FormSection>

        <FormSection title="Pricing">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Base price (USD)" required type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-ink">Volume pricing tiers</span>
              <button
                type="button"
                onClick={() => setTiers((t) => [...t, { minQ: "", maxQ: "", price: "" }])}
                className="text-[12.5px] text-teal hover:underline"
              >
                + Add tier
              </button>
            </div>
            {tiers.length === 0 && (
              <p className="text-[12.5px] text-ink-faint">No tiers — the base price applies at every quantity.</p>
            )}
            <div className="flex flex-col gap-2">
              {tiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 font-mono tabular text-[13px]">
                  <input type="number" placeholder="Min qty" value={tier.minQ} onChange={(e) => setTiers((t) => t.map((x, j) => (j === i ? { ...x, minQ: e.target.value } : x)))} className="w-[90px] border border-line rounded-sm px-2 py-1.5 bg-card outline-none focus:border-teal" />
                  <span className="text-ink-faint">–</span>
                  <input type="number" placeholder="Max qty" value={tier.maxQ} onChange={(e) => setTiers((t) => t.map((x, j) => (j === i ? { ...x, maxQ: e.target.value } : x)))} className="w-[90px] border border-line rounded-sm px-2 py-1.5 bg-card outline-none focus:border-teal" />
                  <span className="text-ink-faint">@</span>
                  <input type="number" step="0.01" placeholder="Unit price" value={tier.price} onChange={(e) => setTiers((t) => t.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className="w-[110px] border border-line rounded-sm px-2 py-1.5 bg-card outline-none focus:border-teal" />
                  <button type="button" onClick={() => setTiers((t) => t.filter((_, j) => j !== i))} aria-label="Remove tier" className="text-ink-faint hover:text-low">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-ink-faint mt-2">Use max qty 1000 for an open-ended “N+” tier.</p>
          </div>
        </FormSection>

        <FormSection title="Inventory">
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <FormField label="Stock quantity (blank = untracked)" type="number" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} />
            <div className="flex gap-5 pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-ink">
                <input type="checkbox" checked={form.isInStock} onChange={(e) => set("isInStock", e.target.checked)} className="h-4 w-4 accent-teal" />
                In stock
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-ink">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-teal" />
                <Star size={13} className="text-amber" /> Featured
              </label>
            </div>
          </div>
        </FormSection>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14px] px-6 py-3 hover:bg-teal-deep transition-colors disabled:opacity-60"
          >
            {pending ? "Saving…" : productId ? "Save product" : "Create product"}
          </button>
          {productId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-sm border border-low text-low text-[13px] px-4 py-3 hover:bg-low-bg transition-colors disabled:opacity-60"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-line rounded-[4px] p-5">
        <h2 className="eyebrow mb-3">Images</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square border border-line rounded-sm overflow-hidden group">
              <Image src={url} alt="" fill className="object-contain p-1" sizes="100px" />
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-teal/85 text-[#F4FBF8] text-[9px] font-mono text-center py-0.5">
                  HERO
                </span>
              )}
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                aria-label="Remove image"
                className="absolute top-1 right-1 bg-card border border-line rounded-full p-1 opacity-0 group-hover:opacity-100 text-low transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {images.length === 0 && <p className="col-span-3 text-[12.5px] text-ink-faint">No images yet.</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-[12px] text-ink-soft mb-2" />
        <button
          type="button"
          onClick={handleUpload}
          disabled={pending}
          className="w-full rounded-sm border border-teal text-teal text-[13px] font-medium px-4 py-2 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
        >
          Upload image
        </button>
        <p className="text-[11px] text-ink-faint mt-2">First image is the hero. Remember to save after changes.</p>

        <h2 className="eyebrow mt-6 mb-3 pt-5 border-t border-line">Certificate of Analysis</h2>
        {coaUrl ? (
          <div className="flex items-center justify-between gap-2 text-[12.5px] mb-2">
            <a href={coaUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline truncate">
              View current COA (PDF)
            </a>
            <button type="button" onClick={() => setCoaUrl(null)} className="text-low hover:underline shrink-0">
              Remove
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-ink-faint mb-2">No COA attached.</p>
        )}
        <input ref={coaRef} type="file" accept="application/pdf" className="block w-full text-[12px] text-ink-soft mb-2" />
        <button
          type="button"
          onClick={handleCoaUpload}
          disabled={pending}
          className="w-full rounded-sm border border-teal text-teal text-[13px] font-medium px-4 py-2 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
        >
          Upload COA
        </button>

        <h2 className="eyebrow mt-6 mb-3 pt-5 border-t border-line">Additional certificates (by lot)</h2>
        <p className="text-[11px] text-ink-faint mb-2">
          For separate lab-batch/lot certificates of the same product — shown alongside the main COA above.
        </p>
        {additionalCoas.length > 0 && (
          <ul className="flex flex-col gap-1.5 mb-3">
            {additionalCoas.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline truncate">
                  {c.label}
                </a>
                <button
                  type="button"
                  onClick={() => setAdditionalCoas((prev) => prev.filter((_, j) => j !== i))}
                  className="text-low hover:underline shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          value={newCoaLabel}
          onChange={(e) => setNewCoaLabel(e.target.value)}
          placeholder="Label, e.g. Lot #4471"
          className="w-full border border-line rounded-sm px-2.5 py-1.5 text-[12.5px] bg-card outline-none focus:border-teal transition-colors mb-2"
        />
        <input ref={extraCoaRef} type="file" accept="application/pdf" className="block w-full text-[12px] text-ink-soft mb-2" />
        <button
          type="button"
          onClick={handleExtraCoaUpload}
          disabled={pending}
          className="w-full rounded-sm border border-teal text-teal text-[13px] font-medium px-4 py-2 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
        >
          Upload additional certificate
        </button>
      </div>
    </form>
  );
}
