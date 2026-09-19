"use client";
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const ArrowsPlay = () => {
  const canvasRef = useRef(null);
  const motionEnabled = !useReducedMotion();
  const mouseRef = useRef({ x: 0, y: 0 });
  const arrowsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const divRef = useRef(null); // For the center div with text

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
        this.rotationEase = 0.12;
      }

      update(mouseX, mouseY) {
        this.dx = mouseX - this.pos.x;
        this.dy = mouseY - this.pos.y;
        const targetAngle = Math.atan2(this.dy, this.dx);

        // Ease rotation across the shortest arc so large direction changes do not snap.
        let delta = targetAngle - this.angle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;

        this.angle += delta * this.rotationEase;
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(-30, 0);
        ctx.moveTo(30, 0);
        ctx.lineTo(10, -20);
        ctx.moveTo(30, 0);
        ctx.lineTo(10, 20);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'white';
        ctx.stroke();
        ctx.restore();
      }
    }

    const initializeArrows = (canvas) => {
      const arrows = [];
      const spacing = 120;

      const cols = Math.floor(canvas.width / spacing);
      const rows = Math.floor(canvas.height / spacing);

      const xPadding = (canvas.width - (cols * spacing)) / 2;
      const yPadding = (canvas.height - (rows * spacing)) / 2;

      // Get div position relative to canvas
      const divRect = divRef.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      const divLeft = divRect.left - canvasRect.left;
      const divRight = divRect.right - canvasRect.left;
      const divTop = divRect.top - canvasRect.top;
      const divBottom = divRect.bottom - canvasRect.top;

      for (let y = 0;y <= rows;y++) {
        for (let x = 0;x <= cols;x++) {
          const arrowPos = new Point(
            x * spacing + xPadding,
            y * spacing + yPadding
          );


          if (
            arrowPos.x >= divLeft &&
            arrowPos.x <= divRight &&
            arrowPos.y >= divTop &&
            arrowPos.y <= divBottom
          ) {
            continue;
          }

          arrows.push(new Arrow(arrowPos));
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
    mouseRef.current = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };

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
  }, [motionEnabled]);

  return (
    <div className="relative w-full h-full ">
      <canvas
        ref={canvasRef} aria-hidden="true"
        className="w-full h-full"
        style={{ cursor: 'pointer' }}
      />
      <div
        ref={divRef}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{
          cursor: "pointer",
          height: "25cqw",
          width: "32cqw",
          backgroundColor: "transparent",
        }}
      >
        <p className='text-center text-[15cqw] leading-none text-[var(--fg)] transition-all duration-500 ease'>
          Play
        </p>
      </div>
    </div>
  );
};

export default ArrowsPlay;
