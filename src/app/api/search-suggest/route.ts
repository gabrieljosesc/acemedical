import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const admin = createAdminClient();
  const term = `%${q.replace(/[\\%_]/g, "")}%`;
  const { data } = await admin
    .from("products")
    .select("id, slug, name, price, images")
    .or(`name.ilike.${term},sku.ilike.${term}`)
    .eq("is_in_stock", true)
    .order("featured", { ascending: false })
    .limit(8);

  const results = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    image: p.images?.[0] ?? null,
  }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=30" } }
  );
}
