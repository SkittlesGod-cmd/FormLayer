"use client";

import { motion } from "framer-motion";
import type { ProductType } from "@/lib/formulations/types";

interface Props {
  productType: ProductType | string;
  complianceScore?: number | null;
}

const PARTICLE_COLORS = ["#6366f1", "#818cf8", "#10b981", "#f59e0b", "#3b82f6"];
const CELEBRATION_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${10 + ((i * 37) % 80)}%`,
  top: `${10 + ((i * 29) % 60)}%`,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  y: -40 - ((i * 17) % 60),
  x: (i * 23) % 60 - 30,
  delay: 0.3 + ((i * 11) % 10) / 10,
}));

function CapsuleAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="capTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="capBot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      {/* Body (bottom half) */}
      <motion.g
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <rect x="70" y="100" width="60" height="55" rx="4" fill="url(#capBot)" />
        <ellipse cx="100" cy="155" rx="30" ry="10" fill="#cbd5e1" />
      </motion.g>
      {/* Cap (top half) */}
      <motion.g
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <rect x="66" y="45" width="68" height="55" rx="4" fill="url(#capTop)" />
        <ellipse cx="100" cy="45" rx="34" ry="10" fill="#818cf8" />
      </motion.g>
      {/* Shine */}
      <motion.rect
        x="78" y="55" width="6" height="30" rx="3" fill="white" opacity={0}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ delay: 1, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      />
      {/* Particles filling body */}
      {[85, 95, 105, 115].map((x, i) => (
        <motion.circle
          key={i}
          cx={x} cy={145} r={3}
          fill="#6366f1"
          opacity={0}
          initial={{ cy: 200, opacity: 0 }}
          animate={{ cy: [200, 130 + i * 5], opacity: [0, 0.6, 0] }}
          transition={{ delay: 0.8 + i * 0.15, duration: 1, repeat: Infinity, repeatDelay: 3 }}
        />
      ))}
    </svg>
  );
}

function TabletAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="tabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <motion.g
        initial={{ scaleY: 1.6, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "100px 100px" }}
      >
        <ellipse cx="100" cy="100" rx="60" ry="18" fill="url(#tabGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
        <ellipse cx="100" cy="100" rx="60" ry="18" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 3" />
      </motion.g>
      {/* Score line */}
      <motion.line
        x1="100" y1="87" x2="100" y2="113"
        stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        style={{ transformOrigin: "100px 100px" }}
      />
      {/* Stamp effect */}
      <motion.ellipse
        cx="100" cy="100" rx="62" ry="20"
        fill="none" stroke="#6366f1" strokeWidth="2"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 1.5 }}
        transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatDelay: 2.5 }}
        style={{ transformOrigin: "100px 100px" }}
      />
      {/* Shine pulse */}
      <motion.ellipse
        cx="82" cy="95" rx="8" ry="3"
        fill="white"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ delay: 1.2, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      />
    </svg>
  );
}

function SoftgelAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="gelShell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="gelFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <clipPath id="gelClip">
          <ellipse cx="100" cy="100" rx="52" ry="38" />
        </clipPath>
      </defs>
      {/* Shell */}
      <motion.ellipse
        cx="100" cy="100" rx="52" ry="38"
        fill="url(#gelShell)" stroke="#f59e0b" strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "100px 100px" }}
      />
      {/* Liquid fill rising */}
      <motion.rect
        x="48" y="100" width="104" height="38" fill="url(#gelFill)"
        clipPath="url(#gelClip)"
        initial={{ y: 140 }}
        animate={{ y: 70 }}
        transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
      />
      {/* Shine */}
      <motion.ellipse
        cx="82" cy="87" rx="10" ry="5" fill="white"
        animate={{ opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Seam */}
      <motion.line
        x1="48" y1="100" x2="152" y2="100"
        stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.3 }}
      />
    </svg>
  );
}

function GummyAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="gumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        style={{ transformOrigin: "100px 110px" }}
      >
        {/* Gummy cube shape */}
        <rect x="65" y="75" width="70" height="70" rx="18" fill="url(#gumGrad)" />
        {/* Eyes */}
        <circle cx="87" cy="105" r="5" fill="white" />
        <circle cx="113" cy="105" r="5" fill="white" />
        <circle cx="88" cy="106" r="2.5" fill="#1f2937" />
        <circle cx="114" cy="106" r="2.5" fill="#1f2937" />
        {/* Smile */}
        <path d="M 88 117 Q 100 126 112 117" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Shine */}
        <ellipse cx="83" cy="88" rx="7" ry="4" fill="white" opacity={0.4} />
      </motion.g>
      {/* Bounce */}
      <motion.g
        animate={{ y: [0, -10, 0] }}
        transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 110px" }}
      >
        <rect x="65" y="75" width="70" height="70" rx="18" fill="url(#gumGrad)" opacity={0} />
      </motion.g>
    </svg>
  );
}

function PowderAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="scoopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      {/* Scoop */}
      <motion.path
        d="M 55 140 Q 55 175 100 175 Q 145 175 145 140 Z"
        fill="url(#scoopGrad)" stroke="#94a3b8" strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: "100px 155px" }}
      />
      {/* Handle */}
      <motion.path
        d="M 140 145 Q 165 135 158 115"
        stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      />
      {/* Powder particles falling */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.circle
          key={i}
          cx={70 + (i % 6) * 12}
          cy={80}
          r={i % 3 === 0 ? 3 : 2}
          fill={i % 2 === 0 ? "#6366f1" : "#818cf8"}
          initial={{ cy: 30, opacity: 0 }}
          animate={{
            cy: [30, 130 + (i % 3) * 8],
            opacity: [0, 0.8, 0.4],
          }}
          transition={{
            delay: 0.3 + i * 0.08,
            duration: 0.9,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeIn",
          }}
        />
      ))}
      {/* Powder mound */}
      <motion.ellipse
        cx="100" cy="152" rx="35" ry="10"
        fill="#818cf8" opacity={0}
        animate={{ opacity: [0, 0.4] }}
        transition={{ delay: 1.2, duration: 0.5 }}
      />
    </svg>
  );
}

function LiquidAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <clipPath id="bottleClip">
          <path d="M 78 75 L 72 95 L 68 160 Q 68 170 100 170 Q 132 170 132 160 L 128 95 L 122 75 Z" />
        </clipPath>
      </defs>
      {/* Bottle outline */}
      <motion.path
        d="M 78 75 L 72 95 L 68 160 Q 68 170 100 170 Q 132 170 132 160 L 128 95 L 122 75 Z"
        fill="url(#bottleGrad)" stroke="#cbd5e1" strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: "100px 130px" }}
      />
      {/* Cap */}
      <motion.rect x="82" y="60" width="36" height="17" rx="4" fill="#6366f1"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 60, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      {/* Liquid rising */}
      <motion.rect
        x="68" y="100" width="64" height="70"
        fill="url(#liquidGrad)"
        clipPath="url(#bottleClip)"
        initial={{ y: 175 }}
        animate={{ y: 105 }}
        transition={{ delay: 0.6, duration: 1.4, ease: "easeInOut" }}
      />
      {/* Bubbles */}
      {[82, 100, 115].map((x, i) => (
        <motion.circle
          key={i}
          cx={x} cy={150} r={3}
          fill="white" opacity={0}
          animate={{ cy: [150, 120], opacity: [0, 0.6, 0] }}
          transition={{ delay: 1.5 + i * 0.3, duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
      {/* Shine */}
      <motion.rect x="78" y="110" width="4" height="45" rx="2" fill="white" opacity={0.3} />
    </svg>
  );
}

function TopicalAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="tubeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="gelOut" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* Tube body */}
      <motion.rect x="55" y="90" width="90" height="55" rx="8"
        fill="url(#tubeGrad)" stroke="#a78bfa" strokeWidth="1.5"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 55, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {/* Tube cap */}
      <motion.rect x="140" y="97" width="22" height="40" rx="5" fill="#7c3aed"
        initial={{ x: 115, opacity: 0 }}
        animate={{ x: 140, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {/* Squeeze crinkle */}
      <motion.rect x="55" y="107" width="30" height="24" rx="4" fill="#b8a9f8" />
      {/* Gel coming out */}
      <motion.path
        d="M 55 112 Q 40 115 35 130 Q 33 145 42 152 Q 52 158 58 148 Q 48 140 50 130 Q 53 120 55 118 Z"
        fill="url(#gelOut)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "55px 130px" }}
      />
      {/* Label lines */}
      <motion.rect x="80" y="105" width="45" height="2.5" rx="1" fill="white" opacity={0.5}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ transformOrigin: "80px 105px" }}
      />
      <motion.rect x="80" y="113" width="30" height="2.5" rx="1" fill="white" opacity={0.35}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        style={{ transformOrigin: "80px 113px" }}
      />
    </svg>
  );
}

function StripAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="size-full">
      <defs>
        <linearGradient id="stripGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
        </linearGradient>
      </defs>
      {/* Strip */}
      <motion.rect
        x="45" y="88" width="110" height="24" rx="5"
        fill="url(#stripGrad)" stroke="#93c5fd" strokeWidth="1.5"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "100px 100px" }}
      />
      {/* Dissolve shimmer */}
      <motion.rect
        x="45" y="88" width="110" height="24" rx="5"
        fill="white"
        animate={{ opacity: [0, 0.4, 0], scaleX: [1, 0.2, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity, repeatDelay: 1 }}
        style={{ transformOrigin: "150px 100px" }}
      />
      {/* Particles dissolving */}
      {[60, 80, 100, 120, 140].map((x, i) => (
        <motion.circle
          key={i}
          cx={x} cy={100} r={2.5}
          fill="#60a5fa"
          animate={{
            cy: [100, 80 + i * 3],
            opacity: [0.7, 0],
            scale: [1, 0],
          }}
          transition={{ delay: 1.2 + i * 0.12, duration: 1, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
      {/* Perforation dots */}
      {[65, 80, 95, 110, 125, 140].map((x, i) => (
        <motion.circle
          key={i}
          cx={x} cy={100} r={1.5}
          fill="white" opacity={0.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 + i * 0.06 }}
        />
      ))}
    </svg>
  );
}

const ANIMATION_MAP: Partial<Record<string, React.FC>> = {
  capsule: CapsuleAnimation,
  tablet: TabletAnimation,
  softgel: SoftgelAnimation,
  gummy: GummyAnimation,
  powder: PowderAnimation,
  liquid: LiquidAnimation,
  topical: TopicalAnimation,
  strip: StripAnimation,
};

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.p
          className="font-mono text-2xl font-bold text-gray-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {score}
        </motion.p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">score</p>
      </div>
    </div>
  );
}

export function ProductAnimation({ productType, complianceScore }: Props) {
  const Anim = ANIMATION_MAP[productType] ?? CapsuleAnimation;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Product animation */}
      <motion.div
        className="relative flex size-48 items-center justify-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-brand/10"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-brand/5"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <div className="relative size-36">
          <Anim />
        </div>
      </motion.div>

      {/* Compliance score ring */}
      {complianceScore != null && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ScoreRing score={complianceScore} />
          <p className="text-[12px] font-medium text-gray-500">
            {complianceScore >= 90 ? "Fully compliant"
              : complianceScore >= 70 ? "Minor issues"
              : complianceScore >= 50 ? "Requires review"
              : "Major concerns"}
          </p>
        </motion.div>
      )}

      {/* Confetti-style particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CELEBRATION_PARTICLES.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              backgroundColor: particle.color,
            }}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, particle.y],
              x: [particle.x],
            }}
            transition={{
              delay: particle.delay,
              duration: 1.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
