"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertBlogPost, deleteBlogPost } from "@/app/actions/blog";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  is_published: boolean;
};

export default function BlogEditor({ post }: { post: Post | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? "",
    isPublished: post?.is_published ?? false,
  });
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertBlogPost({ id: post?.id ?? null, ...form });
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        if (!post && result.id) {
          router.push(`/admin/blog/${result.id}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteBlogPost(post.id);
      if (result.ok) {
        toast.success(result.message ?? "Deleted");
        router.push("/admin/blog");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[720px]">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Title</span>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">
          Slug <span className="font-normal text-ink-faint">(blank = derived from the title)</span>
        </span>
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="e.g. how-cold-chain-shipping-works"
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] font-mono bg-card outline-none focus:border-teal transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Excerpt</span>
        <input
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          placeholder="One-sentence summary shown on the listing"
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Body</span>
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          rows={16}
          required
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors leading-relaxed"
        />
      </label>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          className="h-4 w-4 accent-teal"
        />
        <span className="text-[13.5px] text-ink">Published</span>
      </label>

      <div className="flex items-center gap-4 mt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : post ? "Save post" : "Create post"}
        </button>
        {post && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-[13px] text-low hover:underline disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
