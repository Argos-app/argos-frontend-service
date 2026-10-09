import { useState } from "react";
import { getInitials, hasValidPhoto } from "@/lib/format";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

export function AvatarComponent({ name, photoUrl, className = "" }: AvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const showImage = hasValidPhoto(photoUrl ?? "") && failedPhotoUrl !== photoUrl;

  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-sand text-xs font-medium text-brand-forest ${className}`}
    >
      {showImage ? (
        <img
          src={photoUrl ?? undefined}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedPhotoUrl(photoUrl ?? null)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
