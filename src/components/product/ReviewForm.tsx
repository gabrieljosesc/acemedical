"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview, deleteReview } from "@/app/actions/reviews";

type Existing = { rating: number; title: string; body: string } | null;

export default function ReviewForm({
  productId,
  slug,
  signedIn,
  existing,
}: {
  productId: string;
  slug: string;
  signedIn: boolean;
  existing: Existing;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="bg-card border border-line rounded-[4px] p-5">
        <h3 className="eyebrow mb-2">Write a review</h3>
        <p className="text-[13.5px] text-ink-soft mb-4">
          Sign in to your trade account to share your experience with this product.
        </p>
        <Link
          href={`/auth/login?next=/product/${slug}`}
          className="inline-flex rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4.5 py-2.5 hover:bg-teal-deep transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Select a star rating first.");
      return;
    }
    startTransition(async () => {
      const result = await submitReview({ productId, slug, rating, title, body });
      if (result.ok) {
        toast.success(result.message ?? "Review published");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Remove your review?")) return;
    startTransition(async () => {
      const result = await deleteReview(productId, slug);
      if (result.ok) {
        toast.success(result.message ?? "Review removed");
        setRating(0);
        setTitle("");
        setBody("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5">
      <h3 className="eyebrow mb-4">{existing ? "Edit your review" : "Write a review"}</h3>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              size={22}
              className={
                n <= (hovered || rating) ? "text-amber fill-amber" : "text-line-strong hover:text-amber"
              }
            />
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-[13px] font-medium text-ink">Title (optional)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Sums it up in a line"
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-[13px] font-medium text-ink">Review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          required
          placeholder="How did this product perform in your practice?"
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : existing ? "Update review" : "Publish review"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-[13px] text-low hover:underline disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
