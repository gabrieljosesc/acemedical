import { createAdminClient } from "@/lib/supabase/server";

export type DoseOption = { slug: string; dose: string; current: boolean };

const DOSE_RE = /^(.*\S)\s+(\d+(?:\.\d+)?\s?(?:mg|mcg|iu))$/i;

/** "BPC-157 20mg" → { base: "BPC-157", dose: "20mg" }; null when no trailing dose. */
export function parsePeptideTitle(name: string): { base: string; dose: string } | null {
  const m = name.trim().match(DOSE_RE);
  if (!m) return null;
  return { base: m[1].toLowerCase(), dose: m[2].replace(/\s+/g, "") };
}

function doseValueMg(dose: string): number {
  const n = parseFloat(dose);
  if (/mcg/i.test(dose)) return n / 1000;
  return n; // treat mg and iu on their own scales; sort within unit is fine
}

/**
 * Other strengths of the same peptide (matched on the title with the trailing
 * dose stripped), so the product page can offer 5mg / 10mg / 20mg pills.
 */
export async function getDoseSiblings(
  categorySlug: string,
  productName: string,
  productSlug: string
): Promise<DoseOption[]> {
  if (categorySlug !== "peptides") return [];
  const parsed = parsePeptideTitle(productName);
  if (!parsed) return [];

  const admin = createAdminClient();
  const { data: category } = await admin.from("categories").select("id").eq("slug", "peptides").single();
  if (!category) return [];

  const { data: products } = await admin
    .from("products")
    .select("slug, name, is_in_stock")
    .eq("category_id", category.id)
    .limit(500);

  const siblings = (products ?? [])
    .map((p) => ({ ...p, parsed: parsePeptideTitle(p.name) }))
    .filter((p) => p.parsed?.base === parsed.base && p.is_in_stock)
    .map((p) => ({ slug: p.slug, dose: p.parsed!.dose, current: p.slug === productSlug }))
    .sort((a, b) => doseValueMg(a.dose) - doseValueMg(b.dose));

  return siblings.length > 1 ? siblings : [];
}
