export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="evently-mark" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e5173f" />
            <stop offset="1" stopColor="#6e0e22" />
          </linearGradient>
        </defs>
        {/* Ticket-stub silhouette: rounded rect with two notches, like a torn admit-one ticket */}
        <path
          d="M4 10a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v2a2.5 2.5 0 0 0 0 5v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a2.5 2.5 0 0 0 0-5v-2Z"
          fill="url(#evently-mark)"
        />
        <path d="M13 7.5v17" stroke="#0a0a0b" strokeWidth="1.5" strokeDasharray="2.4 2.4" strokeLinecap="round" />
        <path d="M17.5 13.5 21 16l-3.5 2.5v-5Z" fill="#0a0a0b" />
      </svg>
      <span
        className="font-display text-2xl tracking-wide text-text"
        style={{ letterSpacing: "0.02em" }}
      >
        Event<span className="text-primary-hover">ly</span>
      </span>
    </span>
  );
}
