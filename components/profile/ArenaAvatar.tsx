import {
  getAvatarPreset,
  type AvatarPreset,
} from "@/lib/demo/customization";

export default function ArenaAvatar({
  avatarId,
  className = "",
  frame = "free",
  title,
}: {
  avatarId: AvatarPreset["id"] | string;
  className?: string;
  frame?: "free" | "pro" | "ultra";
  title?: string;
}) {
  const avatar = getAvatarPreset(avatarId);
  const frameClass =
    frame === "ultra"
      ? "ring-2 ring-fuchsia-300 shadow-[0_0_0_3px_rgba(217,70,239,0.16)]"
      : frame === "pro"
        ? "ring-2 ring-arena-blue shadow-[0_0_0_3px_rgba(245,158,11,0.16)]"
        : "ring-1 ring-arena-border";

  return (
    <span
      aria-label={title}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-mono font-extrabold ${frameClass} ${className}`}
      style={{
        background: avatar.background,
        color: avatar.foreground,
      }}
    >
      {avatar.mark}
    </span>
  );
}
