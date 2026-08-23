/**
 * Site-wide color pattern — soft geometric splashes so no page is pure white.
 * Fixed + overflow clipped so shapes never create horizontal scroll.
 */

export function BrandBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#FFF8F0]" />

      <div className="absolute -left-24 -top-16 h-56 w-56 rounded-full bg-[#FF6B2C]/25 blur-3xl sm:h-[28rem] sm:w-[28rem] sm:-left-32 sm:-top-24" />

      <div className="absolute -right-16 top-0 h-48 w-48 rounded-[2rem] bg-[#7C3AED]/20 blur-3xl sm:h-[24rem] sm:w-[24rem] sm:-right-24 sm:rounded-[3rem]" />

      <div className="absolute bottom-1/3 left-[10%] h-40 w-40 rounded-full bg-[#22C55E]/15 blur-3xl sm:left-1/4 sm:h-64 sm:w-80" />

      <div className="absolute right-[15%] top-1/3 h-28 w-28 rounded-full bg-[#FBBF24]/25 blur-2xl sm:right-1/4 sm:h-40 sm:w-40" />

      <div className="absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-[#A78BFA]/20 blur-3xl sm:-bottom-20 sm:h-72 sm:w-72" />

      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#FF6B2C]/15 blur-3xl sm:-bottom-16 sm:-left-16 sm:h-56 sm:w-56" />
    </div>
  );
}
