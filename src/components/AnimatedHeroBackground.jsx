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
      const count = isMobile ? 55 : 130;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        vx: (Math.random() - .5) * .18,
        vy: (Math.random() - .5) * .18,
        a: Math.random() * .5 + .1,
        speed: Math.random() * .018 + .004,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Soft nebula glow — top right
      const g1 = ctx.createRadialGradient(W * .75, H * .2, 0, W * .75, H * .2, W * .5);
      g1.addColorStop(0, 'rgba(59,130,246,.09)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Second warm glow — bottom left
      const g2 = ctx.createRadialGradient(W * .15, H * .85, 0, W * .15, H * .85, W * .4);
      g2.addColorStop(0, 'rgba(245,166,35,.05)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      const now = Date.now();
      particles.forEach(p => {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        const alpha = Math.max(.06, Math.min(.75, p.a + Math.sin(now * p.speed) * .12));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
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
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#030408', zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Globe — pure CSS, no external image */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '-40%' : '-8%',
        bottom: isMobile ? '-15%' : '-22%',
        width: isMobile ? '110vw' : '820px',
        height: isMobile ? '110vw' : '820px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #1a3a6b 0%, #0d1f3c 30%, #060d1a 65%, #020508 100%)',
        boxShadow: `
          inset -50px -50px 120px rgba(0,0,0,.95),
          inset 25px 25px 70px rgba(255,255,255,.06),
          inset 0 0 50px rgba(59,130,246,.35),
          0 0 100px rgba(59,130,246,.18),
          0 0 200px rgba(59,130,246,.08)
        `,
        pointerEvents: 'none',
      }}>
        {/* Landmass hints — abstract shapes */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 28% 22% at 38% 42%, rgba(34,197,94,.12) 0%, transparent 100%),
            radial-gradient(ellipse 18% 30% at 55% 60%, rgba(34,197,94,.08) 0%, transparent 100%),
            radial-gradient(ellipse 22% 14% at 25% 62%, rgba(34,197,94,.06) 0%, transparent 100%),
            radial-gradient(ellipse 12% 20% at 68% 35%, rgba(34,197,94,.07) 0%, transparent 100%)
          `,
        }} />
        {/* City lights hint */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 6% 4% at 40% 44%, rgba(255,220,100,.15) 0%, transparent 100%),
            radial-gradient(ellipse 3% 2% at 52% 38%, rgba(255,200,80,.12) 0%, transparent 100%),
            radial-gradient(ellipse 4% 3% at 62% 55%, rgba(255,180,60,.10) 0%, transparent 100%)
          `,
        }} />
      </div>

      {/* Orbit rings */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '-50%' : '-14%',
        bottom: isMobile ? '-25%' : '-34%',
        width: isMobile ? '160vw' : '1060px',
        height: isMobile ? '160vw' : '1060px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,.03)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
      }} />
      <div style={{
        position: 'absolute',
        right: isMobile ? '-62%' : '-22%',
        bottom: isMobile ? '-35%' : '-48%',
        width: isMobile ? '210vw' : '1280px',
        height: isMobile ? '210vw' : '1280px',
        borderRadius: '50%',
        border: '1px solid rgba(59,130,246,.05)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
      }} />

      {/* Left text-readability gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, #030408 28%, rgba(3,4,8,.75) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom blend */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(to top, #04050a, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
