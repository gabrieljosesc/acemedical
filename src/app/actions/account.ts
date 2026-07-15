"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AccountActionResult = { ok: true } | { ok: false; message: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_MAX_BYTES = 1024 * 1024; // 1 MB
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(formData: FormData): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image file first." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, message: "Image must be 1 MB or smaller." };
  }
  const ext = AVATAR_TYPES[file.type];
  if (!ext) {
    return { ok: false, message: "Use a JPEG, PNG, or WebP image." };
  }

  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, message: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) return { ok: false, message: "Couldn't save your photo. Please try again." };

  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { ok: false, message: "Couldn't remove your photo. Please try again." };

  revalidatePath("/account", "layout");
  return { ok: true };
}

// ── Password ────────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Must include at least one special character (!@#$%...)"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePassword(input: {
  newPassword: string;
  confirmPassword: string;
}): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

// ── Notification & privacy preferences ─────────────────────────────────────

export async function saveNotificationSettings(prefs: {
  emailOrderUpdates: boolean;
  emailProductNews: boolean;
}): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preferences: {
        email_order_updates: prefs.emailOrderUpdates,
        email_product_news: prefs.emailProductNews,
      },
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: "Couldn't save your preferences. Please try again." };

  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function savePrivacySettings(prefs: { analyticsOptIn: boolean }): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { error } = await supabase
    .from("profiles")
    .update({ privacy_preferences: { analytics_opt_in: prefs.analyticsOptIn } })
    .eq("id", user.id);

  if (error) return { ok: false, message: "Couldn't save your preferences. Please try again." };

  revalidatePath("/account/privacy");
  return { ok: true };
}

// ── Addresses ───────────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().trim().max(60).optional(),
  recipientName: z.string().trim().min(1, "Recipient name is required").max(200),
  phone: z.string().trim().max(40).optional(),
  line1: z.string().trim().min(1, "Street address is required").max(300),
  line2: z.string().trim().max(300).optional(),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().trim().min(1, "State / province is required").max(120),
  postalCode: z.string().trim().min(1, "ZIP / postal code is required").max(32),
  country: z.string().trim().min(1, "Country is required").max(120),
  isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;

function toAddressRow(input: AddressInput, userId: string) {
  return {
    user_id: userId,
    label: input.label || null,
    recipient_name: input.recipientName,
    phone: input.phone || null,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: input.country,
    is_default: input.isDefault,
    updated_at: new Date().toISOString(),
  };
}

export async function createAddress(input: AddressInput): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the address fields." };
  }

  const { count } = await supabase
    .from("user_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const makeDefault = input.isDefault || (count ?? 0) === 0;

  if (makeDefault) {
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("user_addresses")
    .insert(toAddressRow({ ...parsed.data, isDefault: makeDefault }, user.id));

  if (error) return { ok: false, message: "Couldn't save the address. Please try again." };

  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function updateAddress(id: string, input: AddressInput): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the address fields." };
  }

  if (input.isDefault) {
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("user_addresses")
    .update(toAddressRow(parsed.data, user.id))
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "Couldn't update the address. Please try again." };

  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const { error } = await supabase.from("user_addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: "Couldn't delete the address. Please try again." };

  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<AccountActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("user_addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "Couldn't set the default address. Please try again." };

  revalidatePath("/account/addresses");
  return { ok: true };
}
