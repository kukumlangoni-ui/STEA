import { useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';

export default function AnimatedHeroBackground() {
  const canvasRef = useRef(null);
  const isMobile = useMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let W = 0, H = 0;
    let particles = [];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildParticles();
    };

    const buildParticles = () => {
      // More particles, bigger, brighter — so they're actually VISIBLE
      const count = isMobile ? 90 : 180;
      particles = Array.from({ length: count }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.8 + 0.4,      // bigger min radius
        vx:    (Math.random() - 0.5) * 0.22,
        vy:    (Math.random() - 0.5) * 0.22,
        a:     Math.random() * 0.65 + 0.25,    // brighter baseline alpha
        speed: Math.random() * 0.016 + 0.003,
        twinkle: Math.random() * Math.PI * 2,  // phase offset for twinkle
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const now = Date.now() * 0.001;

      // ── Nebula glows — more vivid, moved to be behind text ──────────
      // Blue nebula — upper right (where the globe is)
      const g1 = ctx.createRadialGradient(W * 0.78, H * 0.15, 0, W * 0.78, H * 0.15, W * 0.55);
      g1.addColorStop(0, 'rgba(59,130,246,0.18)');   // was 0.09 — doubled
      g1.addColorStop(0.5, 'rgba(59,130,246,0.06)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Gold nebula — upper left area (near headline)
      const g2 = ctx.createRadialGradient(W * 0.08, H * 0.25, 0, W * 0.08, H * 0.25, W * 0.45);
      g2.addColorStop(0, 'rgba(245,166,35,0.12)');   // was 0.05
      g2.addColorStop(0.6, 'rgba(245,166,35,0.04)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // Deep violet accent — center-bottom
      const g3 = ctx.createRadialGradient(W * 0.45, H * 0.85, 0, W * 0.45, H * 0.85, W * 0.4);
      g3.addColorStop(0, 'rgba(99,60,180,0.10)');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, W, H);

      // ── Stars / particles ────────────────────────────────────────────
      particles.forEach(p => {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;

        // Gentle twinkle
        const twinkle = Math.sin(now * p.speed * 6 + p.twinkle);
        const alpha = Math.max(0.1, Math.min(0.9, p.a + twinkle * 0.18));

        // Vary star color slightly — mostly white with hints of gold/blue
        const hue = p.twinkle % (Math.PI * 2);
        let starColor;
        if (hue < 0.8)        starColor = `rgba(245,210,140,${alpha * 0.7})`; // warm gold
        else if (hue < 1.6)   starColor = `rgba(160,195,255,${alpha * 0.7})`; // cool blue
        else                   starColor = `rgba(255,255,255,${alpha})`;        // pure white

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.fill();

        // Larger stars get a soft glow halo
        if (p.r > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.06})`;
          ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(160deg, #020408 0%, #030610 40%, #040820 100%)',
      zIndex: 0,
    }}>
      {/* Stars canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* ── Globe — repositioned higher, more visible on mobile ── */}
      <div style={{
        position: 'absolute',
        right:  isMobile ? '-35%'  : '-6%',
        bottom: isMobile ? '-8%'   : '-18%',
        width:  isMobile ? '105vw' : '840px',
        height: isMobile ? '105vw' : '840px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 36%, #1e4080 0%, #0e2244 28%, #060e1e 60%, #020508 100%)',
        boxShadow: `
          inset -55px -55px 130px rgba(0,0,0,.92),
          inset 30px  30px  80px  rgba(255,255,255,.07),
          inset 0     0     60px  rgba(59,130,246,.45),
          0     0     120px rgba(59,130,246,.22),
          0     0     260px rgba(59,130,246,.10)
        `,
        pointerEvents: 'none',
        // Subtle slow rotation via CSS
        animation: 'globeDrift 40s ease-in-out infinite alternate',
      }}>
        {/* Landmass shapes — slightly more visible green */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 30% 24% at 37% 42%, rgba(34,197,94,.18) 0%, transparent 100%),
            radial-gradient(ellipse 20% 32% at 54% 60%, rgba(34,197,94,.12) 0%, transparent 100%),
            radial-gradient(ellipse 24% 16% at 24% 63%, rgba(34,197,94,.09) 0%, transparent 100%),
            radial-gradient(ellipse 14% 22% at 67% 36%, rgba(34,197,94,.11) 0%, transparent 100%)
          `,
        }} />
        {/* City lights — slightly brighter */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 7% 5% at 40% 44%, rgba(255,220,100,.22) 0%, transparent 100%),
            radial-gradient(ellipse 4% 3% at 52% 38%, rgba(255,200,80,.18) 0%, transparent 100%),
            radial-gradient(ellipse 5% 4% at 62% 55%, rgba(255,180,60,.15) 0%, transparent 100%),
            radial-gradient(ellipse 3% 2% at 28% 50%, rgba(255,220,120,.12) 0%, transparent 100%)
          `,
        }} />
        {/* Atmospheric rim light */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, transparent 55%, rgba(59,130,246,.12) 75%, rgba(59,130,246,.05) 100%)',
        }} />
      </div>

      {/* ── Orbit rings — thicker, more glowing ── */}
      <div style={{
        position: 'absolute',
        right:  isMobile ? '-48%' : '-12%',
        bottom: isMobile ? '-18%' : '-30%',
        width:  isMobile ? '155vw' : '1080px',
        height: isMobile ? '155vw' : '1080px',
        borderRadius: '50%',
        border: '1px solid rgba(59,130,246,.08)',
        boxShadow: '0 0 40px rgba(59,130,246,.04)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
        animation: 'orbitSpin 60s linear infinite',
      }} />
      <div style={{
        position: 'absolute',
        right:  isMobile ? '-60%' : '-20%',
        bottom: isMobile ? '-28%' : '-44%',
        width:  isMobile ? '200vw' : '1300px',
        height: isMobile ? '200vw' : '1300px',
        borderRadius: '50%',
        border: '1px solid rgba(245,166,35,.05)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
        animation: 'orbitSpin 90s linear infinite reverse',
      }} />

      {/* ── A third inner ring — adds depth ── */}
      <div style={{
        position: 'absolute',
        right:  isMobile ? '-38%' : '-3%',
        bottom: isMobile ? '-12%' : '-16%',
        width:  isMobile ? '115vw' : '920px',
        height: isMobile ? '115vw' : '920px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,.025)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
      }} />

      {/* ── Satellite dot on orbit ring ── */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          right: '36%',
          bottom: '44%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#F5A623',
          boxShadow: '0 0 12px #F5A623, 0 0 24px rgba(245,166,35,.5)',
          animation: 'satelliteOrbit 8s linear infinite',
        }} />
      )}

      {/* ── Text-readability gradient — LESS opaque so background shows ── */}
      <div style={{
        position: 'absolute', inset: 0,
        // Reduced left coverage: was 28%→100%, now uses lighter values
        background: 'linear-gradient(95deg, rgba(2,4,8,.88) 0%, rgba(2,4,8,.72) 38%, rgba(2,4,8,.35) 62%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top fade — keeps it dark at the very top for navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to bottom, rgba(2,4,8,.6), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Bottom blend */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to top, #04050a, transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes globeDrift {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-14px) scale(1.012); }
        }
        @keyframes orbitSpin {
          from { transform: rotateX(68deg) rotateY(18deg) rotateZ(0deg); }
          to   { transform: rotateX(68deg) rotateY(18deg) rotateZ(360deg); }
        }
        @keyframes satelliteOrbit {
          0%   { transform: translate(0px, 0px); opacity: 1; }
          25%  { transform: translate(-60px, -30px); opacity: 0.7; }
          50%  { transform: translate(-100px, 20px); opacity: 1; }
          75%  { transform: translate(-50px, 60px); opacity: 0.7; }
          100% { transform: translate(0px, 0px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
