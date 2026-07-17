"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ReviewResult = { ok: true; message?: string } | { ok: false; message: string };

export async function submitReview(input: {
  productId: string;
  slug: string;
  rating: number;
  title: string;
  body: string;
}): Promise<ReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in to leave a review." };

  const rating = Math.floor(input.rating);
  if (!input.productId || rating < 1 || rating > 5) {
    return { ok: false, message: "Select a rating from 1 to 5 stars." };
  }
  const body = input.body.trim().slice(0, 2000);
  if (!body) return { ok: false, message: "Please write a few words about the product." };

  const admin = createAdminClient();

  // "Verified purchase" — the reviewer has an order containing this product.
  const { data: purchase } = await admin
    .from("order_items")
    .select("id, order:orders!inner(user_id)")
    .eq("product_id", input.productId)
    .eq("order.user_id", user.id)
    .limit(1);
  const isVerified = Boolean(purchase?.length);

  const { error } = await admin.from("product_reviews").upsert(
    {
      product_id: input.productId,
      user_id: user.id,
      rating,
      title: input.title.trim().slice(0, 120) || null,
      body,
      is_verified: isVerified,
    },
    { onConflict: "product_id,user_id" }
  );

  if (error) {
    console.error("submitReview error:", error.message);
    return { ok: false, message: "We couldn't save your review. Please try again." };
  }

  if (input.slug) revalidatePath(`/product/${input.slug}`);
  return { ok: true, message: "Thank you! Your review has been published." };
}

export async function deleteReview(productId: string, slug: string): Promise<ReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("product_id", productId)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "We couldn't remove your review. Please try again." };

  if (slug) revalidatePath(`/product/${slug}`);
  return { ok: true, message: "Review removed." };
}
