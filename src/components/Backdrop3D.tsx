const ICONS = ["🎤", "🎬", "🎭", "🏏", "🎵", "🖼️"];
const CYCLE_SECONDS = 18; // total loop length; each icon gets an equal slice

/**
 * Decorative, purely-CSS "revolving" showcase of category icons (mic →
 * cinema clapperboard → drama masks → trophy → music → art), each entering
 * and exiting via a 3D Y-axis rotation. Every icon shares one @keyframes
 * loop (see globals.css) offset by a negative animation-delay, so only one
 * is ever prominent at a time — no JS, no layout thrash.
 *
 * variant="hero"    — large, prominent; used once on the landing page.
 * variant="ambient" — small, very low-opacity; used site-wide for a
 *                     consistent-but-subtle version of the same motif.
 */
export default function Backdrop3D({
  variant = "ambient",
}: {
  variant?: "hero" | "ambient";
}) {
  const isHero = variant === "hero";
  const slice = CYCLE_SECONDS / ICONS.length;

  return (
    <div
      aria-hidden="true"
      className={
        isHero
          ? "backdrop-stage pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] opacity-45 sm:h-[30rem]"
          : "backdrop-stage pointer-events-none fixed inset-x-0 top-0 -z-10 hidden h-[26rem] opacity-[0.07] sm:block"
      }
      style={
        isHero
          ? {
              maskImage:
                "linear-gradient(to bottom, black 0%, black 45%, transparent 85%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 45%, transparent 85%)",
            }
          : undefined
      }
    >
      {ICONS.map((icon, i) => (
        <span
          key={icon}
          className={`backdrop-icon ${isHero ? "text-[9rem] sm:text-[13rem]" : "text-[10rem]"}`}
          style={{
            animationDuration: `${CYCLE_SECONDS}s`,
            animationDelay: `${i * -slice}s`,
            filter: isHero
              ? "drop-shadow(0 0 60px rgba(176,20,47,0.55))"
              : "drop-shadow(0 0 40px rgba(176,20,47,0.4))",
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}
