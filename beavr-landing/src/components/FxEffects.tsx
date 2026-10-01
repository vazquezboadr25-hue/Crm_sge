"use client";

import { useEffect, useRef } from "react";

/** Barra de progreso de scroll, cabecera de cristal al bajar y foco de luz que sigue al cursor en tarjetas. */
export default function FxEffects() {
  const bar = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`;
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(".product-card-inner, .form-shell");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--sy", `${event.clientY - rect.top}px`);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointermove", onPointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={bar} className="fx-progress" aria-hidden="true" />;
}
