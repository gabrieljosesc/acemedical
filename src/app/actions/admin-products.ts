"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { parsePriceTiers } from "@/lib/price-tiers";
import { slugify } from "@/lib/utils";

export type AdminProductResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; message: string };

export type ProductFormInput = {
  name: string;
  slug: string;
  sku: string;
  price: number;
  priceTiers: { minQ: number; maxQ: number; price: number }[];
  stockQuantity: number | null;
  isInStock: boolean;
  featured: boolean;
  categoryId: string | null;
  brandId: string | null;
  description: string;
  images: string[];
  coaUrl: string | null;
};

function toRow(input: ProductFormInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim() || slugify(input.name),
    sku: input.sku.trim() || null,
    price: Math.max(0, Number(input.price) || 0),
    price_tiers: parsePriceTiers(input.priceTiers),
    stock_quantity: input.stockQuantity === null ? null : Math.max(0, Math.round(input.stockQuantity)),
    is_in_stock: input.isInStock,
    featured: input.featured,
    category_id: input.categoryId || null,
    brand_id: input.brandId || null,
    description: input.description.trim() || null,
    images: input.images.filter(Boolean),
    coa_url: input.coaUrl || null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveProduct(id: string, input: ProductFormInput): Promise<AdminProductResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };
  if (!input.name.trim()) return { ok: false, message: "Product name is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("products").update(toRow(input)).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "That slug is already in use." };
    return { ok: false, message: "Couldn't save the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${input.slug}`);
  revalidatePath("/shop");
  return { ok: true, message: "Product saved." };
}

export async function createProduct(input: ProductFormInput): Promise<AdminProductResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };
  if (!input.name.trim()) return { ok: false, message: "Product name is required." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .insert({ ...toRow(input), specs: [] })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, message: "That slug is already in use." };
    return { ok: false, message: "Couldn't create the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, message: "Product created.", id: data.id };
}

export async function deleteProduct(id: string): Promise<AdminProductResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      message: "Couldn't delete — the product may be referenced by past orders. Mark it out of stock instead.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, message: "Product deleted." };
}

export async function uploadProductCoa(formData: FormData): Promise<AdminProductResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const file = formData.get("coa");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a PDF file first." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, message: "COA must be a PDF." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "PDF must be 5 MB or smaller." };
  }

  const admin = createAdminClient();
  const path = `coas/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const { error } = await admin.storage
    .from("product-coas")
    .upload(path, file, { contentType: "application/pdf" });
  if (error) return { ok: false, message: "Upload failed — has supabase/coa.sql been run?" };

  const {
    data: { publicUrl },
  } = admin.storage.from("product-coas").getPublicUrl(path);

  return { ok: true, message: publicUrl };
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadProductImage(formData: FormData): Promise<AdminProductResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image file first." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, message: "Image must be 2 MB or smaller." };
  }
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, message: "Use a JPEG, PNG, or WebP image." };

  const admin = createAdminClient();
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });
  if (error) return { ok: false, message: "Upload failed — has supabase/store-completeness.sql been run?" };

  const {
    data: { publicUrl },
  } = admin.storage.from("product-images").getPublicUrl(path);

  return { ok: true, message: publicUrl };
}
