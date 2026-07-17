"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type BlogResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function upsertBlogPost(input: {
  id?: string | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  isPublished: boolean;
}): Promise<BlogResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, message: "Give the post a title." };
  if (!body) return { ok: false, message: "The post body is empty." };

  const slug = slugify(input.slug.trim() || title);
  if (!slug) return { ok: false, message: "That slug isn't valid." };

  const admin = createAdminClient();
  const record = {
    title,
    slug,
    excerpt: input.excerpt.trim() || null,
    body,
    is_published: input.isPublished,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    // Preserve the original published_at when re-saving an already-published post.
    const { data: existing } = await admin
      .from("blog_posts")
      .select("published_at")
      .eq("id", input.id)
      .single();
    const { error } = await admin
      .from("blog_posts")
      .update({
        ...record,
        published_at: input.isPublished ? (existing?.published_at ?? new Date().toISOString()) : null,
      })
      .eq("id", input.id);
    if (error) {
      return { ok: false, message: error.code === "23505" ? "That slug is already in use." : error.message };
    }
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return { ok: true, message: "Post saved.", id: input.id };
  }

  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      ...record,
      author_id: adminUser.id,
      published_at: input.isPublished ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.code === "23505" ? "That slug is already in use." : (error?.message ?? "Couldn't create the post.") };
  }
  revalidatePath("/blog");
  return { ok: true, message: "Post created.", id: data.id };
}

export async function deleteBlogPost(id: string): Promise<BlogResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete the post. Please try again." };

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true, message: "Post deleted." };
}
