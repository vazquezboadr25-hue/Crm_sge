"use client";

export default function ScreenComposition() {
  return (
    <div className="hero-stage" aria-hidden="true">
      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div className="hero-grid" />

      <div className="screen-stack">
        <article className="ui-panel ui-panel-back float-a">
          <div className="ui-chrome">
            <span />
            <span />
            <span />
          </div>
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
          <div className="ui-chrome dark">
            <span />
            <span />
            <span />
          </div>
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
