/**
 * Site-wide color pattern — soft geometric splashes so no page is pure white.
 * Fixed, non-interactive, sits behind content. Hero pages can still add
 * stronger local shapes on top.
 */

export function BrandBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#FFF8F0]" />

      <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#FF6B2C]/25 blur-3xl" />

      <div className="absolute -right-24 top-0 h-[24rem] w-[24rem] rounded-[3rem] bg-[#7C3AED]/20 blur-3xl" />

      <div className="absolute bottom-1/3 left-1/4 h-64 w-80 rounded-full bg-[#22C55E]/15 blur-3xl" />

      <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-[#FBBF24]/30 blur-2xl" />

      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#A78BFA]/20 blur-3xl" />

      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#FF6B2C]/15 blur-3xl" />
    </div>
  );
}
