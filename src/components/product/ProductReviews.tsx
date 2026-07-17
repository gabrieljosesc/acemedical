import { Star, BadgeCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import ReviewForm from "@/components/product/ReviewForm";

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  created_at: string;
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "text-amber fill-amber" : "text-line-strong"}
        />
      ))}
    </span>
  );
}

export default async function ProductReviews({ productId, slug }: { productId: string; slug: string }) {
  const admin = createAdminClient();
  const user = await getAuthUser();

  const { data: reviews } = await admin
    .from("product_reviews")
    .select("id, user_id, rating, title, body, is_verified, created_at")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (reviews ?? []) as ReviewRow[];

  // Display names, resolved server-side (profiles are not publicly readable).
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", userIds)
    : { data: [] };
  const nameById = new Map(
    (profiles ?? []).map((p) => {
      const first = (p.first_name ?? "").trim();
      const lastInitial = (p.last_name ?? "").trim().charAt(0);
      return [p.id, first ? `${first}${lastInitial ? ` ${lastInitial}.` : ""}` : "Verified customer"];
    })
  );

  const average = rows.length ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : 0;
  const ownReview = user ? rows.find((r) => r.user_id === user.id) : undefined;

  return (
    <section className="mt-16 pt-10 border-t border-line" id="reviews">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="eyebrow mb-2">Reviews</p>
          <h2 className="font-serif font-medium text-[24px] tracking-tight">
            What practitioners say
          </h2>
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-2.5">
            <Stars value={average} size={16} />
            <span className="font-mono tabular text-[14px] text-ink">{average.toFixed(1)}</span>
            <span className="text-[13px] text-ink-faint">
              · {rows.length} review{rows.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div>
          {rows.length === 0 ? (
            <p className="text-[14px] text-ink-faint border border-dashed border-line rounded-[4px] px-5 py-8 text-center">
              No reviews yet — be the first to share your experience.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <Stars value={r.rating} />
                    <span className="text-[13.5px] font-medium text-ink">
                      {nameById.get(r.user_id) ?? "Verified customer"}
                    </span>
                    {r.is_verified && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase text-stock">
                        <BadgeCheck size={12} /> Verified purchase
                      </span>
                    )}
                    <span className="text-[12px] text-ink-faint ml-auto">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {r.title && <p className="text-[14.5px] font-medium text-ink mb-1">{r.title}</p>}
                  <p className="text-[14px] text-ink-soft leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReviewForm
          productId={productId}
          slug={slug}
          signedIn={Boolean(user)}
          existing={
            ownReview
              ? { rating: ownReview.rating, title: ownReview.title ?? "", body: ownReview.body }
              : null
          }
        />
      </div>
    </section>
  );
}
