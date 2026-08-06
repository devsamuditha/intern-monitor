"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface PreloaderAnimationProps {
  className?: string;
  running?: boolean;
}

const SIZE = 100;
const NODE_COUNT = 12;
const BOUND_RADIUS = SIZE * 0.42;
const HUE_BASE = 165;
const SPAWN_INTERVAL = 0.45;
const SIGNAL_MAX_JUMPS = 4;
const FADE_DURATION = 0.5;

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getRandom<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

interface Node {
  x: number;
  y: number;
  _x: number;
  _y: number;
  driftR: number;
  driftPhase: number;
  connections: Node[];
}

interface SignalPart {
  start: Node;
  end: Node;
  strength: number;
  style: string;
  _time: number;
  prevTime: number;
  duration: number;
  complete: boolean;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
}

interface Signal {
  parts: SignalPart[];
  strength: number;
  jumps: number;
  maxJumps: number;
  style: string;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  const f = t - 1;
  return f * f * f + 1;
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function lerpPt(out: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
}

const PreloaderAnimation: React.FC<PreloaderAnimationProps> = ({ className, running = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const signalCountRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const runningRef = useRef(running);
  const lastTimeRef = useRef(0);
  const initializedRef = useRef(false);

  const initNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    context.scale(dpr, dpr);

    const center = { x: SIZE / 2, y: SIZE / 2 };

    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = BOUND_RADIUS * Math.sqrt(Math.random());
      const x = center.x + Math.cos(angle) * r;
      const y = center.y + Math.sin(angle) * r;
      nodes.push({
        x, y, _x: x, _y: y,
        driftR: randomRange(-1.2, 1.2),
        driftPhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    nodes.forEach((n) => {
      const others = nodes.filter((o) => o !== n)
        .sort((a, b) => dist(n, a) - dist(n, b));
      const connectCount = Math.floor(randomRange(2, 4));
      for (let k = 0; k < connectCount; k++) {
        const candidate = others[k];
        if (candidate && n.connections.indexOf(candidate) === -1) {
          n.connections.push(candidate);
        }
      }
    });

    nodesRef.current = nodes;
  }, []);

  const createSignal = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return null;

    const startNode = getRandom(nodes);
    const maxJumps = Math.floor(randomRange(3, SIGNAL_MAX_JUMPS + 1));
    const hue = HUE_BASE + ((signalCountRef.current * 37) % 90) - 30;
    const style = "hsl(" + hue + ", 90%, 62%)";
    signalCountRef.current++;

    const signal: Signal = {
      parts: [],
      strength: 2.6,
      jumps: 0,
      maxJumps,
      style,
    };

    startNode.connections.forEach((c) => {
      signal.parts.push({
        start: startNode,
        end: c,
        strength: signal.strength,
        style,
        _time: 0,
        prevTime: 0,
        duration: 0.55,
        complete: false,
        p0: { x: 0, y: 0 },
        p1: { x: 0, y: 0 },
      });
    });

    return signal;
  }, []);

  const update = useCallback((dt: number) => {
    timeRef.current += dt;

    nodesRef.current.forEach((n) => {
      n.x = n._x + Math.sin(timeRef.current * 1.4 + n.driftPhase) * n.driftR;
      n.y = n._y + Math.cos(timeRef.current * 1.4 + n.driftPhase) * n.driftR;
    });

    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= SPAWN_INTERVAL) {
      spawnTimerRef.current = 0;
      const sig = createSignal();
      if (sig) signalsRef.current.push(sig);
    }

    signalsRef.current = signalsRef.current.filter((s) => {
      const doneNow: SignalPart[] = [];
      for (let i = s.parts.length - 1; i >= 0; i--) {
        s.parts[i].prevTime = s.parts[i]._time;
        s.parts[i]._time = Math.min(s.parts[i]._time + dt, s.parts[i].duration);
        s.parts[i].complete = s.parts[i]._time >= s.parts[i].duration;
        if (s.parts[i].complete) {
          doneNow.push(s.parts.splice(i, 1)[0]);
        }
      }

      if (doneNow.length > 0) {
        s.jumps++;
        s.strength = Math.max(0.6, s.strength - 0.35);
        const finished = s.jumps >= s.maxJumps || (s.strength <= 0.6 && s.jumps > 1);

        if (!finished) {
          doneNow.forEach((part) => {
            const options = part.end.connections.filter((c) => c !== part.start);
            const opts = options.length === 0 ? part.end.connections : options;
            const branchCount = Math.min(opts.length, Math.random() < 0.35 ? 2 : 1);
            const chosen = opts.slice().sort(() => Math.random() - 0.5).slice(0, branchCount);
            chosen.forEach((next) => {
              s.parts.push({
                start: part.end,
                end: next,
                strength: s.strength,
                style: s.style,
                _time: 0,
                prevTime: 0,
                duration: 0.55,
                complete: false,
                p0: { x: 0, y: 0 },
                p1: { x: 0, y: 0 },
              });
            });
          });
        }

        if (finished && s.parts.length === 0) return false;
      }

      return true;
    });
  }, [createSignal]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    nodesRef.current.forEach((n) => {
      n.connections.forEach((c) => {
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "#5eead4";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      });
    });

    nodesRef.current.forEach((n, i) => {
      const p = 0.5 + 0.5 * Math.sin(timeRef.current * 2.4 + i * 0.7);
      ctx.globalAlpha = 0.45 + p * 0.4;
      ctx.beginPath();
      ctx.fillStyle = "#5eead4";
      ctx.arc(n.x, n.y, 1.1 + p * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    signalsRef.current.forEach((s) => {
      s.parts.forEach((part) => {
        const t0 = easeOutCubic(part.prevTime / part.duration);
        const t1 = easeOutQuad(part._time / part.duration);
        lerpPt(part.p0, part.start, part.end, t0);
        lerpPt(part.p1, part.start, part.end, t1);

        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = part.style;
        ctx.lineWidth = part.strength * 0.7;
        ctx.lineCap = "round";
        ctx.shadowColor = part.style;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(part.p0.x, part.p0.y);
        ctx.lineTo(part.p1.x, part.p1.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    runningRef.current = running;

    if (running) {
      if (!initializedRef.current) {
        initNodes();
        initializedRef.current = true;
      }

      timeRef.current = 0;
      spawnTimerRef.current = 0;
      signalsRef.current = [];
      lastTimeRef.current = 0;

      function loop(timestamp: number) {
        if (!runningRef.current) return;

        if (lastTimeRef.current === 0) {
          lastTimeRef.current = timestamp;
        }
        const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = timestamp;

        update(dt);
        draw();

        rafRef.current = requestAnimationFrame(loop);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      lastTimeRef.current = 0;
    };
  }, [running, initNodes, update, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: SIZE,
        height: SIZE,
        opacity: running ? 1 : 0,
        transition: `opacity ${FADE_DURATION}s ease`,
      }}
      className={className}
    />
  );
};

export { PreloaderAnimation };
export default PreloaderAnimation;