/**
 * Promote an existing user to admin:
 *   node scripts/create-admin.mjs you@example.com
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email>");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("email", email)
  .select("id, email, role");

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
if (!data || data.length === 0) {
  console.error(`No profile found for ${email} — sign up with that email first.`);
  process.exit(1);
}
console.log(`✓ ${email} is now an admin`);
