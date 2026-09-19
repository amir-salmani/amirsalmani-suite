"use client";
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const Lines = () => {
  const canvasRef = useRef(null);
  const motionEnabled = !useReducedMotion();
  const mouseRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef([]);
  const animationFrameRef = useRef(null);

  const lineLength = 30;

  useEffect(() => {
    class Point {
      constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
      }

      draw(ctx, mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const unitX = dx / distance;
        const unitY = dy / distance;
        const lineEndX = this.x + unitX * lineLength;
        const lineEndY = this.y + unitY * lineLength;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const initializePoints = (canvas) => {
      const points = [];
      const spacing = 60;
      const cols = Math.floor(canvas.width / spacing);
      const rows = Math.floor(canvas.height / spacing);

      for (let y = 0;y <= rows;y++) {
        for (let x = 0;x <= cols;x++) {
          points.push(new Point(x * spacing, y * spacing));
        }
      }
      return points;
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement.clientWidth || 1;
        canvas.height = canvas.parentElement.clientHeight || 1;
        pointsRef.current = initializePoints(canvas);
      }
    };

    const handleMouseMove = (e) => {
      if (!motionEnabled) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const main = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pointsRef.current.forEach(point => point.draw(ctx, mouseRef.current.x, mouseRef.current.y));
      if (motionEnabled) animationFrameRef.current = requestAnimationFrame(main);
    };

    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) return;
    canvas.width = canvas.parentElement.clientWidth || 1;
    canvas.height = canvas.parentElement.clientHeight || 1;
    pointsRef.current = initializePoints(canvas);
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas.parentElement);
    canvas.addEventListener('mousemove', handleMouseMove);
    main();
    return () => {
      observer.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [motionEnabled]);

  return <canvas ref={canvasRef} aria-hidden="true" className="w-full h-full " style={{ cursor: 'pointer' }} />;
};

export default Lines;
