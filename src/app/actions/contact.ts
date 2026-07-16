"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function submitContactMessage(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!input.name.trim() || !input.email.trim() || !input.subject.trim() || !input.message.trim()) {
    return { ok: false, message: "Please fill in your name, email, subject, and message." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_messages").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    subject: input.subject.trim(),
    message: input.message.trim(),
  });

  if (error) return { ok: false, message: "Couldn't send your message. Please try again." };
  return { ok: true };
}
