/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Network signal background animation                               */
/* ------------------------------------------------------------------ */

interface NetNode {
  x: number;
  y: number;
  _x: number;
  _y: number;
  r: number;
  connections: NetNode[];
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getRandom<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

function lerp(n1: { x: number; y: number }, n2: { x: number; y: number }, t: number, p: { x: number; y: number }) {
  p.x = n1.x + t * (n2.x - n1.x);
  p.y = n1.y + t * (n2.y - n1.y);
  return p;
}

const Ease = {
  outCubic: (t: number, b: number, c: number, d: number) => {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
  outQuad: (t: number, b: number, c: number, d: number) => {
    return -c * (t /= d) * (t - 2) + b;
  },
};

class SignalPart {
  start: NetNode;
  end: NetNode;
  strength: number;
  style: string;
  _time = 0;
  prevTime = 0;
  duration = 2;
  complete = false;
  p0 = { x: 0, y: 0 };
  p1 = { x: 0, y: 0 };

  constructor(start: NetNode, end: NetNode, strength: number, style: string) {
    this.start = start;
    this.end = end;
    this.strength = strength;
    this.style = style;
  }

  set time(v: number) {
    this.prevTime = this._time;
    this._time = v >= this.duration ? this.duration : v;
    this.complete = this._time === this.duration;
  }
  get time() {
    return this._time;
  }

  draw(ctx: CanvasRenderingContext2D, alpha: number) {
    const t0 = Ease.outCubic(this.prevTime, 0, 1, this.duration);
    const t1 = Ease.outQuad(this.time, 0, 1, this.duration);
    lerp(this.start, this.end, t0, this.p0);
    lerp(this.start, this.end, t1, this.p1);

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.style;
    ctx.lineWidth = this.strength * 0.22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.p0.x, this.p0.y);
    ctx.lineTo(this.p1.x, this.p1.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

class Signal {
  start: NetNode;
  parts: SignalPart[] = [];
  completeParts: SignalPart[] = [];
  strength = 3.2;
  jumps = 0;
  style: string;

  constructor(start: NetNode, signalCount: number) {
    this.start = start;
    const tint = (signalCount % 12) * 30;
    this.style = `hsl(${170 + (tint % 60)}, 85%, 60%)`;

    for (let i = 0; i < start.connections.length; i++) {
      this.parts.push(new SignalPart(start, start.connections[i], this.strength, this.style));
    }
  }

  update(timeStep: number) {
    let complete = false;
    this.completeParts.length = 0;

    for (let i = this.parts.length - 1; i >= 0; i--) {
      this.parts[i].time += timeStep;
      if (this.parts[i].complete) {
        this.completeParts.push(this.parts.splice(i, 1)[0]);
      }
    }

    if (this.completeParts.length > 0) {
      this.jumps++;
      this.strength--;
      complete = this.jumps === 3;
    }

    if (!complete) {
      for (const part of this.completeParts) {
        const end = part.end;
        for (const connection of end.connections) {
          this.parts.push(new SignalPart(end, connection, this.strength, this.style));
        }
      }
    }

    return complete;
  }

  draw(ctx: CanvasRenderingContext2D, alpha: number) {
    for (const part of this.parts) part.draw(ctx, alpha);
  }
}

export interface NetworkBackgroundProps {
  opacity?: number;
  nodeCount?: number;
  className?: string;
}

const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  opacity = 0.35,
  nodeCount = 160,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    const timeStep = 1 / 60;
    let signalCount = 0;
    let nodes: NetNode[] = [];
    let signals: Signal[] = [];
    let animationId: number;
    let transmitId: ReturnType<typeof setInterval>;

    function createNodes() {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        nodes.push({ x, y, _x: x, _y: y, r: randomRange(-8, 8), connections: [] });
      }
    }

    function connectNodes() {
      for (let i = 0; i < nodes.length; i++) {
        let j = 0;
        const connectCount = Math.floor(randomRange(2, 4));
        while (j < connectCount) {
          const connection = getRandom(nodes);
          if (nodes[i] !== connection) {
            nodes[i].connections.push(connection);
            j++;
          }
        }
      }
    }

    function transmit() {
      if (nodes.length === 0) return;
      signals.push(new Signal(getRandom(nodes), signalCount));
      signalCount++;
    }

    function update() {
      for (const n of nodes) {
        n.x = n._x + Math.sin(time) * n.r;
        n.y = n._y + Math.cos(time) * n.r;
      }
      signals = signals.filter((s) => !s.update(timeStep));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      ctx!.globalAlpha = opacity * 0.6;
      ctx!.strokeStyle = "#ffffff";
      ctx!.fillStyle = "#ffffff";
      ctx!.lineWidth = 0.4;
      for (const n of nodes) {
        ctx!.fillRect(n.x, n.y, 1.4, 1.4);
        for (const c of n.connections) {
          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          ctx!.lineTo(c.x, c.y);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;

      for (const s of signals) s.draw(ctx!, opacity * 1.6);
    }

    function loop() {
      update();
      draw();
      time += timeStep;
      animationId = requestAnimationFrame(loop);
    }

    function handleResize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
      createNodes();
      connectNodes();
    }

    createNodes();
    connectNodes();
    transmit();
    transmitId = setInterval(transmit, 1500);
    animationId = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(transmitId);
      resizeObserver.disconnect();
    };
  }, [nodeCount, opacity]);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="pointer-events-none" style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
};

export { NetworkBackground };
