"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useSpring } from "framer-motion";

const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tFront;
  uniform sampler2D tBack;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHover;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = p * 2.0 + vec2(10.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 mouse = uMouse;
    vec2 correctedUv = uv;
    correctedUv.x *= uAspect;
    mouse.x *= uAspect;
    
    float dist = distance(correctedUv, mouse);
    
    // Complex flow noise for organic mask shape
    float n = fbm(uv * 3.5 + uTime * 0.1);
    
    // Smooth, organic mask
    float threshold = uRadius * (1.0 + n * 0.35);
    float mask = smoothstep(threshold, threshold - 0.18, dist);
    
    vec4 front = texture2D(tFront, uv);
    vec4 back = texture2D(tBack, uv);
    
    gl_FragColor = mix(front, back, mask);
  }
`;

export function LiquidRevealFlow({ disableHover = false }: { disableHover?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Smooth mouse coordinates and hover state using springs
  const mouseX = useSpring(0.5, { stiffness: 60, damping: 25 });
  const mouseY = useSpring(0.5, { stiffness: 60, damping: 25 });
  const hoverScale = useSpring(0, { stiffness: 45, damping: 20 });

  useEffect(() => {
    if (disableHover) {
      hoverScale.set(0);
      setIsHovering(false);
    }
  }, [disableHover, hoverScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffers
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Textures
    const textures: WebGLTexture[] = [];
    const loadTexture = (url: string, index: number) => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      
      const img = new Image();
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };
      img.src = url;
      textures.push(tex);
      return tex;
    };

    const tFront = loadTexture("/front.jpg", 0);
    const tBack = loadTexture("/back.png", 1);

    const uniforms = {
      uMouse: gl.getUniformLocation(program, "uMouse"),
      uRadius: gl.getUniformLocation(program, "uRadius"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uAspect: gl.getUniformLocation(program, "uAspect"),
      uHover: gl.getUniformLocation(program, "uHover"),
      tFront: gl.getUniformLocation(program, "tFront"),
      tBack: gl.getUniformLocation(program, "tBack"),
    };

    setIsReady(true);

    let animationFrame: number;
    const render = (time: number) => {
      if (!canvasRef.current) return;
      
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.useProgram(program); // Re-bind just in case

      gl.uniform2f(uniforms.uMouse, mouseX.get(), mouseY.get());
      gl.uniform1f(uniforms.uRadius, hoverScale.get() * 0.4);
      gl.uniform1f(uniforms.uTime, time * 0.001);
      gl.uniform1f(uniforms.uAspect, width / height);
      gl.uniform1f(uniforms.uHover, hoverScale.get());

      gl.uniform1i(uniforms.tFront, 0);
      gl.uniform1i(uniforms.tBack, 1);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      textures.forEach(t => gl.deleteTexture(t));
    };
  }, [mouseX, mouseY, hoverScale]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disableHover || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    if (disableHover) return;
    setIsHovering(true);
    hoverScale.set(1);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    hoverScale.set(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-6xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.8)] border border-white/10 group cursor-crosshair bg-brand-black z-30"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {!isHovering && !disableHover && isReady && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 bg-brand-black/90 text-brand-neon px-6 py-2 rounded-full text-xs font-bold tracking-[0.2em] flex items-center gap-3 backdrop-blur-md z-30 pointer-events-none border border-brand-neon/30 shadow-[0_0_20px_rgba(217,255,0,0.2)]"
        >
          <div className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />
          HOVER TO FLOW
        </motion.div>
      )}
    </div>
  );
}
