"use client";

import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticleNetworkProps {
  /** 0 = white particles (dark bg), 1 = black particles (white bg) */
  colorProgress?: number;
  /** Disables mouse interaction (lines and repulsion) when true */
  disableMouseInteraction?: boolean;
}

export function ParticleNetwork({
  colorProgress = 0,
  disableMouseInteraction = false,
}: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const colorProgressRef = useRef(colorProgress);

  // Keep the refs in sync with the props
  useEffect(() => {
    colorProgressRef.current = colorProgress;
  }, [colorProgress]);

  const disableMouseInteractionRef = useRef(disableMouseInteraction);
  useEffect(() => {
    disableMouseInteractionRef.current = disableMouseInteraction;
  }, [disableMouseInteraction]);

  const PARTICLE_COUNT = 90;
  const CONNECTION_DIST = 150;
  const MOUSE_RADIUS = 200;

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.8 + 0.8,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // Track mouse at window level so it works through all layers
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mousemove", handleMouse);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Interpolate between two colors based on progress
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = disableMouseInteractionRef.current
        ? { x: -1000, y: -1000 }
        : mouseRef.current;
      const t = colorProgressRef.current; // 0 = dark mode, 1 = light mode

      // Draw transitioning background: transparent(dark) → solid white
      if (t > 0) {
        ctx.fillStyle = `rgba(247, 250, 255, ${t})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Particle color: white(255) → black(30)
      const pr = Math.round(lerp(255, 30, t));
      const pg = Math.round(lerp(255, 30, t));
      const pb = Math.round(lerp(255, 30, t));

      // Connection line color: white → slate-300
      const lr = Math.round(lerp(255, 148, t));
      const lg = Math.round(lerp(255, 163, t));
      const lb = Math.round(lerp(255, 184, t));

      // Mouse line color: blue stays blue but accent shifts
      const mr = Math.round(lerp(59, 37, t));
      const mg = Math.round(lerp(130, 99, t));
      const mb = Math.round(lerp(246, 235, t));

      // Update positions
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // Draw connections between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw connections to mouse
      if (mouse.x > 0 && mouse.y > 0) {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MOUSE_RADIUS) {
            const opacity = (1 - dist / MOUSE_RADIUS) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Mouse glow dot
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 6);
        gradient.addColorStop(0, `rgba(${mr}, ${mg}, ${mb}, 0.6)`);
        gradient.addColorStop(1, `rgba(${mr}, ${mg}, ${mb}, 0)`);
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw particles
      for (const p of particles) {
        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glow.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${p.opacity * 0.3})`);
        glow.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${p.opacity})`;
        ctx.fill();
      }

      // Geometric triangle fills
      // Triangle fill color: blue → slate
      const tr = Math.round(lerp(59, 100, t));
      const tg = Math.round(lerp(130, 116, t));
      const tb = Math.round(lerp(246, 139, t));

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dij = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dij > CONNECTION_DIST * 0.7) continue;

          for (let k = j + 1; k < particles.length; k++) {
            const dik = Math.hypot(particles[i].x - particles[k].x, particles[i].y - particles[k].y);
            const djk = Math.hypot(particles[j].x - particles[k].x, particles[j].y - particles[k].y);

            if (dik < CONNECTION_DIST * 0.7 && djk < CONNECTION_DIST * 0.7) {
              const avgDist = (dij + dik + djk) / 3;
              const opacity = (1 - avgDist / (CONNECTION_DIST * 0.7)) * 0.04;

              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.lineTo(particles[k].x, particles[k].y);
              ctx.closePath();
              ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${opacity})`;
              ctx.fill();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
