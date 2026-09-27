"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    step: "01",
    title: "Brief claro",
    text: "Producto, público y objetivo en una conversación.",
  },
  {
    step: "02",
    title: "Pantallas propuestas",
    text: "Estructura, jerarquía y componentes clave.",
  },
  {
    step: "03",
    title: "Frontend listo",
    text: "Lo aprobado en diseño, implementado en código.",
  },
];

export default function ProcessTrack() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`process-track ${visible ? "is-visible" : ""}`}>
      <div className="process-line" aria-hidden="true">
        <span className="process-line-fill" />
      </div>

      <ol className="process-milestones" aria-label="Proceso de trabajo">
        {steps.map((item, index) => (
          <li
            key={item.step}
            className="process-milestone"
            style={{ transitionDelay: visible ? `${180 + index * 160}ms` : undefined }}
          >
            <div className="process-node" aria-hidden="true">
              <span className="process-node-ring" />
              <span className="process-node-dot" />
            </div>
            <div className="process-milestone-body">
              <span className="process-num">{item.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-beavr-deep sm:text-xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
