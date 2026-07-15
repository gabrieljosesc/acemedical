"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateCardNumber, validateExpiry, last4 } from "@/lib/card-validation";
import { encryptCardField } from "@/lib/payment-card-crypto";

export type SavedCardResult = { ok: true } | { ok: false; message: string };

export type SavedCardInput = {
  nameOnCard: string;
  number: string;
  expMonth: string;
  expYear: string;
  setDefault: boolean;
};

export async function addSavedCard(input: SavedCardInput): Promise<SavedCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  if (!input.nameOnCard.trim()) {
    return { ok: false, message: "Enter the name on the card." };
  }
  const { valid, brand } = validateCardNumber(input.number);
  if (!valid) return { ok: false, message: "That card number doesn't look valid." };
  if (!validateExpiry(input.expMonth, input.expYear)) {
    return { ok: false, message: "That expiry date is invalid or in the past." };
  }

  const { count } = await supabase
    .from("user_saved_cards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const makeDefault = input.setDefault || (count ?? 0) === 0;

  if (makeDefault) {
    await supabase.from("user_saved_cards").update({ is_default: false }).eq("user_id", user.id);
  }

  const year = input.expYear.length === 2 ? `20${input.expYear}` : input.expYear;
  const { error } = await supabase.from("user_saved_cards").insert({
    user_id: user.id,
    name_on_card: input.nameOnCard.trim(),
    brand,
    last4: last4(input.number),
    exp_month: parseInt(input.expMonth, 10),
    exp_year: parseInt(year, 10),
    pan_encrypted: encryptCardField(input.number.replace(/\D/g, "")),
    is_default: makeDefault,
  });

  if (error) return { ok: false, message: "Couldn't save the card. Please try again." };

  revalidatePath("/account/payment-methods");
  return { ok: true };
}

export async function deleteSavedCard(id: string): Promise<SavedCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { data: card } = await supabase
    .from("user_saved_cards")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase.from("user_saved_cards").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: "Couldn't remove the card. Please try again." };

  // If the default card was removed, promote the most recent remaining one.
  if (card?.is_default) {
    const { data: remaining } = await supabase
      .from("user_saved_cards")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (remaining?.[0]) {
      await supabase.from("user_saved_cards").update({ is_default: true }).eq("id", remaining[0].id);
    }
  }

  revalidatePath("/account/payment-methods");
  return { ok: true };
}

export async function setDefaultSavedCard(id: string): Promise<SavedCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  await supabase.from("user_saved_cards").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("user_saved_cards")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "Couldn't set the default card. Please try again." };

  revalidatePath("/account/payment-methods");
  return { ok: true };
}
