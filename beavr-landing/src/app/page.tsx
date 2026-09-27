import Image from "next/image";
import LeadForm from "@/components/LeadForm";
import ProcessTrack from "@/components/ProcessTrack";
import Reveal from "@/components/Reveal";
import ScreenComposition from "@/components/ScreenComposition";

const services = [
  {
    title: "Diseño de pantallas",
    text: "Flujos, jerarquía y sistemas visuales listos para producto.",
  },
  {
    title: "Frontend de apps",
    text: "Interfaces en código limpio, accesible y fácil de evolucionar.",
  },
  {
    title: "Páginas web",
    text: "Landings y sitios que presentan bien y convierten visitas.",
  },
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="page-shell flex items-center justify-between py-4 sm:py-5">
          <a href="#top" className="brand-link" aria-label="beavr inicio">
            <Image
              src="/logo-full.png"
              alt="beavr"
              width={200}
              height={60}
              priority
              className="h-9 w-auto object-contain sm:h-10 xl:h-11"
            />
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-beavr-deep md:flex">
            <a href="#servicios" className="nav-link">
              Servicios
            </a>
            <a href="#enfoque" className="nav-link">
              Enfoque
            </a>
            <a href="#contacto" className="btn-accent btn-accent-sm">
              Empezar proyecto
            </a>
          </nav>
          <a href="#contacto" className="btn-accent btn-accent-sm md:hidden">
            Contacto
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero-canvas relative flex min-h-[100svh] items-center overflow-hidden pt-24">
          <div className="page-shell grid w-full items-center gap-10 pb-16 pt-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20">
            <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
              <p className="brand-signal animate-rise">beavr</p>
              <h1 className="animate-rise-delay-1 mt-3 max-w-[14ch] text-4xl font-bold leading-[1.02] text-beavr-deep sm:text-5xl xl:text-6xl 2xl:text-[4.1rem]">
                Pantallas que se entienden a la primera
              </h1>
              <p className="animate-rise-delay-2 mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                Diseñamos interfaces y construimos frontends para apps y webs con claridad,
                ritmo visual y foco en conversión.
              </p>
              <div className="animate-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
                <a href="#contacto" className="btn-accent btn-accent-lg pulse-cta">
                  Hablar de tu proyecto
                </a>
                <a href="#servicios" className="btn-ghost">
                  Ver servicios
                </a>
              </div>
            </div>

            <div className="animate-rise-delay-2 relative min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]">
              <ScreenComposition />
            </div>
          </div>
        </section>

        <section id="servicios" className="section-product border-t border-line">
          <div className="page-shell section-pad">
            <div className="section-intro">
              <Reveal from="fade">
                <p className="section-eyebrow">Producto</p>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="section-title">
                  Tres capacidades, un mismo criterio visual
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="section-lead">
                  Del wireframe al frontend en producción, con el mismo lenguaje de marca y
                  jerarquía.
                </p>
              </Reveal>
            </div>

            <ul className="product-grid">
              {services.map((service, index) => {
                const from = index % 2 === 0 ? "left" : "right";
                return (
                  <Reveal
                    key={service.title}
                    as="li"
                    from={from}
                    delay={100 + index * 110}
                    className="product-card"
                  >
                    <article className="product-card-inner">
                      <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="product-card-title">{service.title}</h3>
                      <p className="product-card-text">{service.text}</p>
                      <span className="product-card-accent" aria-hidden="true" />
                    </article>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="enfoque" className="section-process border-t border-line">
          <div className="page-shell section-pad">
            <div className="section-intro section-intro-center">
              <Reveal from="scale">
                <p className="section-eyebrow">Proceso</p>
              </Reveal>
              <Reveal delay={70} from="scale">
                <h2 className="section-title">
                  Un camino corto para decidir rápido
                </h2>
              </Reveal>
              <Reveal delay={130} from="fade">
                <p className="section-lead">
                  Tres hitos. Sin rodeos: alineamos, proponemos y entregamos en código.
                </p>
              </Reveal>
            </div>

            <ProcessTrack />
          </div>
        </section>

        <section id="contacto" className="contact-section border-t border-line">
          <div className="page-shell section-pad">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
              <Reveal>
                <p className="section-eyebrow">Siguiente paso</p>
                <h2 className="section-title section-title-lg mt-3">
                  Cuéntanos qué quieres construir
                </h2>
                <p className="section-lead mt-4">
                  Déjanos el contexto del proyecto y te respondemos con una propuesta clara y
                  realista.
                </p>
                <ul className="contact-points mt-8">
                  <li>Respuesta en 24–48 h</li>
                  <li>Propuesta sin compromiso</li>
                  <li>Diseño + frontend bajo un mismo criterio</li>
                </ul>
              </Reveal>

              <Reveal delay={140} from="scale">
                <div className="form-shell">
                  <LeadForm />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-beavr-deep text-white">
        <div className="page-shell flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
          <a href="#contacto" className="text-sm font-medium text-white/90 transition hover:text-white">
            Empezar un proyecto →
          </a>
          <p className="text-sm text-white/55">© 2026 beavr</p>
        </div>
      </footer>
    </>
  );
}
