import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BlogEditor from "@/components/admin/BlogEditor";

export const metadata = { title: "New post — Admin" };

export default function AdminNewBlogPostPage() {
  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/blog" className="hover:text-teal transition-colors">
          Blog
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">New post</span>
      </nav>
      <h1 className="font-serif font-medium text-[28px] tracking-tight mb-6">New post</h1>
      <BlogEditor post={null} />
    </div>
  );
}
