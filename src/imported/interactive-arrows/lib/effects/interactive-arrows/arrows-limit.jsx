"use client";
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const ArrowsLimit = ({ rows = 3, columns = 6 }) => {
  const canvasRef = useRef(null);
  const motionEnabled = !useReducedMotion();
  const mouseRef = useRef({ x: 0, y: 0 });
  const arrowsRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    class Point {
      constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
      }
    }

    class Arrow {
      constructor(position) {
        this.pos = position;
        this.dx = 0;
        this.dy = 0;
        this.angle = 0;
        this.ease = 0.1;
      }

      update(mouseX, mouseY) {
        const targetDx = mouseX - this.pos.x;
        const targetDy = mouseY - this.pos.y;
        this.dx += (targetDx - this.dx) * this.ease * 0.35;
        this.dy += (targetDy - this.dy) * this.ease * 0.35;
        this.angle = Math.atan2(this.dy, this.dx);
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        const arrowScale = Math.min(1, canvasRef.current.width / 800);
        ctx.scale(arrowScale, arrowScale);
        ctx.beginPath();

        ctx.moveTo(50, 0);
        ctx.lineTo(-50, 0);
        ctx.moveTo(50, 0);
        ctx.lineTo(10, -40);
        ctx.moveTo(50, 0);
        ctx.lineTo(10, 40);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.restore();
      }
    }

    const initializeArrows = (canvas) => {
      const arrows = [];
      const spacingX = canvas.width / (columns + 1);
      const spacingY = canvas.height / (rows + 1);

      for (let y = 1;y <= rows;y++) {
        for (let x = 1;x <= columns;x++) {
          arrows.push(
            new Arrow(
              new Point(
                x * spacingX,
                y * spacingY
              )
            )
          );
        }
      }
      return arrows;
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement.clientWidth || 1;
        canvas.height = canvas.parentElement.clientHeight || 1;
        arrowsRef.current = initializeArrows(canvas);
      }
    };

    const handleMouseMove = (e) => {
      if (!motionEnabled) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    const main = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      const arrows = arrowsRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      arrows.forEach(arrow => {
        arrow.update(mouse.x, mouse.y);
        arrow.draw(ctx);
      });

      if (motionEnabled) animationFrameRef.current = requestAnimationFrame(main);
    };

    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) return;
    canvas.width = canvas.parentElement.clientWidth || 1;
    canvas.height = canvas.parentElement.clientHeight || 1;

    arrowsRef.current = initializeArrows(canvas);
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas.parentElement);
    canvas.addEventListener('mousemove', handleMouseMove);

    main();

    return () => {
      observer.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rows, columns, motionEnabled]);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef} aria-hidden="true"
        className="w-full h-full "
      />
    </div>
  );
};

export default ArrowsLimit;