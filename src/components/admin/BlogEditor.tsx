"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { upsertBlogPost, deleteBlogPost, uploadBlogCoverImage } from "@/app/actions/blog";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  is_published: boolean;
  cover_image_url: string | null;
};

export default function BlogEditor({ post }: { post: Post | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? "",
    isPublished: post?.is_published ?? false,
    coverImageUrl: post?.cover_image_url ?? null as string | null,
  });
  const [pending, startTransition] = useTransition();

  function handleCoverUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image file first.");
      return;
    }
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadBlogCoverImage(formData);
      if (result.ok && result.message) {
        setForm((f) => ({ ...f, coverImageUrl: result.message! }));
        if (fileRef.current) fileRef.current.value = "";
        toast.success("Cover image uploaded.");
      } else if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

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

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Cover image</span>
        {form.coverImageUrl && (
          <div className="relative w-full max-w-[320px] aspect-[16/9] border border-line rounded-sm overflow-hidden group">
            <Image src={form.coverImageUrl} alt="" fill className="object-cover" sizes="320px" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, coverImageUrl: null }))}
              aria-label="Remove cover image"
              className="absolute top-1.5 right-1.5 bg-card border border-line rounded-full p-1 opacity-0 group-hover:opacity-100 text-low transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="block text-[12px] text-ink-soft" />
        <button
          type="button"
          onClick={handleCoverUpload}
          disabled={pending}
          className="self-start rounded-sm border border-teal text-teal text-[12.5px] font-medium px-3.5 py-1.5 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
        >
          Upload cover image
        </button>
      </div>

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
