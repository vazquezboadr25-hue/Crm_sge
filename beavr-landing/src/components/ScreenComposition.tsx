"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

export default function ScreenComposition() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [wire, setWire] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setWire(false), reduce ? 0 : 750);
    return () => window.clearTimeout(timer);
  }, []);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage || event.pointerType !== "mouse") return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty("--mx", String(((event.clientX - rect.left) / rect.width - 0.5) * 2));
    stage.style.setProperty("--my", String(((event.clientY - rect.top) / rect.height - 0.5) * 2));
  }

  function onLeave() {
    stageRef.current?.style.setProperty("--mx", "0");
    stageRef.current?.style.setProperty("--my", "0");
  }

  return (
    <div
      ref={stageRef}
      className={`hero-stage ${wire ? "is-wire" : ""}`}
      aria-hidden="true"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div className="hero-grid" />

      <div className="screen-stack">
        <article className="ui-panel ui-panel-back float-a">
          <div className="ui-chrome"><span /><span /><span /></div>
          <div className="ui-body">
            <div className="ui-line wide" />
            <div className="ui-line mid" />
            <div className="ui-blocks">
              <div className="ui-block" />
              <div className="ui-block soft" />
              <div className="ui-block accent" />
            </div>
          </div>
        </article>

        <article className="ui-panel ui-panel-main float-b">
          <div className="ui-chrome dark"><span /><span /><span /></div>
          <div className="ui-body">
            <div className="ui-kicker" />
            <div className="ui-title" />
            <div className="ui-line mid" />
            <div className="ui-line short" />
            <div className="ui-cta-row">
              <div className="ui-cta filled" />
              <div className="ui-cta outline" />
            </div>
            <div className="ui-side-card">
              <div className="ui-line short" />
              <div className="ui-swatch" />
              <div className="ui-line mid" />
            </div>
          </div>
        </article>

        <article className="ui-panel ui-panel-phone float-c">
          <div className="ui-phone-notch" />
          <div className="ui-body compact">
            <div className="ui-line mid" />
            <div className="ui-swatch tall" />
            <div className="ui-line short" />
            <div className="ui-cta filled slim" />
          </div>
        </article>
      </div>
    </div>
  );
}
