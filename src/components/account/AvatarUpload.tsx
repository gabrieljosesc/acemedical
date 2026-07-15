"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadAvatar, removeAvatar } from "@/app/actions/account";

export default function AvatarUpload({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image file first.");
      return;
    }
    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.ok) {
        toast.success("Photo updated");
        setFileName(null);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.ok) {
        toast.success("Photo removed");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="bg-card border border-line rounded-[4px] p-5 flex flex-col items-center gap-4">
      <div className="self-start">
        <h2 className="text-[15px] font-medium text-ink">Photo</h2>
        <p className="text-[11.5px] text-ink-faint mt-0.5">JPEG, PNG or WebP, max 1 MB.</p>
      </div>

      <div className="w-[140px] h-[140px] rounded-full bg-teal-tint text-teal flex items-center justify-center text-[40px] font-serif font-medium relative overflow-hidden">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="140px" unoptimized />
        ) : (
          displayName.slice(0, 1).toUpperCase()
        )}
      </div>

      <div className="w-full flex flex-col gap-2">
        <label className="border border-line rounded-sm px-3 py-2 text-[12.5px] text-ink-soft cursor-pointer hover:border-line-strong transition-colors text-center truncate">
          {fileName ?? "Choose file…"}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={handleUpload}
          disabled={pending}
          className="rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13px] px-4 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {pending ? "Working…" : "Upload photo"}
        </button>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="rounded-sm border border-line text-[13px] text-ink-soft px-4 py-2 hover:border-low hover:text-low transition-colors disabled:opacity-60"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
