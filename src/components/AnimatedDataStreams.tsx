"use client";

import React, { useEffect, useRef } from 'react';

interface DataStream {
  id: number;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
}

const AnimatedDataStreams: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamsRef = useRef<DataStream[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize data streams
    const initStreams = () => {
      const streams: DataStream[] = [];
      for (let i = 0; i < 50; i++) {
        streams.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 2,
          opacity: 0.1 + Math.random() * 0.3,
          size: 1 + Math.random() * 3
        });
      }
      streamsRef.current = streams;
    };

    initStreams();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      streamsRef.current.forEach((stream, index) => {
        // Update position
        stream.y -= stream.speed;
        stream.x += Math.sin(stream.y * 0.01) * 0.5;

        // Reset if off screen
        if (stream.y < -10) {
          stream.y = canvas.height + 10;
          stream.x = Math.random() * canvas.width;
        }

        // Draw stream
        ctx.beginPath();
        ctx.moveTo(stream.x, stream.y);
        ctx.lineTo(stream.x, stream.y + 20);
        ctx.strokeStyle = `rgba(34, 197, 94, ${stream.opacity})`; // emerald-500
        ctx.lineWidth = stream.size;
        ctx.stroke();

        // Draw data points
        ctx.beginPath();
        ctx.arc(stream.x, stream.y, stream.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${stream.opacity * 1.5})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.3 }}
    />
  );
};

export default AnimatedDataStreams; 