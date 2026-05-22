import AuthForm from "@/components/auth/AuthForm";

export default function SignUpPage() {
  return (
    <div className="-mx-4 -mt-5 grid min-h-[80vh] md:-mt-6 md:grid-cols-2">
      {/* ── Left: dark brand panel ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex"
        style={{ background: "#0f0d0b", color: "#f5f0ea" }}
      >
        {/* Decorative chess grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "repeating-conic-gradient(#f5f0ea 0% 25%, transparent 0% 50%)",
            backgroundSize: "48px 48px",
            transform: "rotate(-8deg) scale(1.3)",
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-lg mb-12">
            <span className="text-2xl" style={{ color: "#f59e0b" }}>♟</span>
            Checkmate Arena
          </div>
          <blockquote>
            <p
              className="text-3xl font-semibold leading-snug"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#f5f0ea" }}
            >
              &ldquo;Your journey to mastery starts now.&rdquo;
            </p>
            <footer className="mt-3 text-sm" style={{ color: "rgba(245,240,234,0.5)" }}>
              Arena Coach
            </footer>
          </blockquote>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-8 text-sm" style={{ color: "rgba(245,240,234,0.6)" }}>
          <div>
            <div className="font-mono font-bold text-base" style={{ color: "#f5f0ea" }}>1,240+</div>
            <div className="text-[11px]">Active players</div>
          </div>
          <div>
            <div className="font-mono font-bold text-base" style={{ color: "#f5f0ea" }}>8,500+</div>
            <div className="text-[11px]">Games played</div>
          </div>
          <div>
            <div className="font-mono font-bold text-base" style={{ color: "#f59e0b" }}>AI</div>
            <div className="text-[11px]">Post-game coach</div>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex items-center justify-center bg-arena-panel p-4 sm:p-8">
        <div className="w-full max-w-[360px]">
          <AuthForm mode="sign-up" />
        </div>
      </div>
    </div>
  );
}
