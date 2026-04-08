// src/components/BrandLogo.jsx
// Reusable STEA brand logo component — premium dark style
// Usage: <BrandLogo size="sm" | "md" | "lg" showText={true|false} />

const SIZE_MAP = {
  sm: { img: 28, text: '1rem', gap: '0.4rem' },
  md: { img: 36, text: '1.2rem', gap: '0.5rem' },
  lg: { img: 48, text: '1.6rem', gap: '0.6rem' },
};

export default function BrandLogo({ size = 'md', showText = true, className = '' }) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <img
        src="/logo-icon.png"
        alt="STEA Africa Icon"
        width={s.img}
        height={s.img}
        style={{
          borderRadius: '22%',
          display: 'block',
          flexShrink: 0,
          imageRendering: 'crisp-edges',
        }}
        draggable={false}
      />
      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: s.text,
            letterSpacing: '0.04em',
            background: 'linear-gradient(135deg, #f5a623 0%, #f5d88a 50%, #e8833a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}
        >
          STEA
        </span>
      )}
    </span>
  );
}
