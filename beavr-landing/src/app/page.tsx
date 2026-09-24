import Image from "next/image";
import LeadForm from "@/components/LeadForm";
import Reveal from "@/components/Reveal";

function ScreenComposition() {
  return (
    <div className="animate-drift relative mx-auto w-full max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
      <svg
        viewBox="0 0 520 420"
        className="h-auto w-full drop-shadow-sm"
        role="img"
        aria-label="Composición de pantallas de interfaz diseñadas por beavr"
      >
        <defs>
          <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef4f3" />
          </linearGradient>
        </defs>

        <rect x="70" y="48" width="360" height="250" rx="18" fill="url(#panel)" stroke="#1a4a5e" strokeWidth="2" />
        <rect x="70" y="48" width="360" height="36" rx="18" fill="#1a4a5e" />
        <circle cx="92" cy="66" r="5" fill="#e07a4f" />
        <circle cx="110" cy="66" r="5" fill="#d5e0de" />
        <circle cx="128" cy="66" r="5" fill="#d5e0de" />

        <rect x="96" y="110" width="120" height="14" rx="4" fill="#1a4a5e" opacity="0.85" />
        <rect x="96" y="136" width="200" height="8" rx="3" fill="#1a4a5e" opacity="0.25" />
        <rect x="96" y="152" width="170" height="8" rx="3" fill="#1a4a5e" opacity="0.18" />
        <rect x="96" y="180" width="100" height="34" rx="8" fill="#e07a4f" />
        <rect x="210" y="180" width="100" height="34" rx="8" fill="none" stroke="#1a4a5e" strokeWidth="2" />

        <rect x="320" y="110" width="88" height="150" rx="12" fill="#fff" stroke="#1a4a5e" strokeWidth="2" />
        <rect x="334" y="126" width="60" height="8" rx="3" fill="#1a4a5e" opacity="0.35" />
        <rect x="334" y="146" width="60" height="48" rx="8" fill="#eef4f3" stroke="#1a4a5e" strokeWidth="1.5" />
        <rect x="334" y="206" width="60" height="8" rx="3" fill="#1a4a5e" opacity="0.2" />
        <rect x="334" y="222" width="44" height="8" rx="3" fill="#1a4a5e" opacity="0.15" />

        <rect x="28" y="160" width="150" height="210" rx="22" fill="#fff" stroke="#1a4a5e" strokeWidth="2.5" />
        <rect x="48" y="178" width="110" height="10" rx="4" fill="#1a4a5e" opacity="0.7" />
        <rect x="48" y="202" width="110" height="70" rx="10" fill="#f3f7f6" stroke="#1a4a5e" strokeWidth="1.5" />
        <rect x="48" y="286" width="110" height="10" rx="4" fill="#1a4a5e" opacity="0.2" />
        <rect x="48" y="306" width="72" height="10" rx="4" fill="#e07a4f" opacity="0.85" />
        <rect x="78" y="350" width="50" height="5" rx="2.5" fill="#1a4a5e" opacity="0.35" />

        <rect x="330" y="250" width="170" height="130" rx="16" fill="#fff" stroke="#1a4a5e" strokeWidth="2" />
        <rect x="348" y="272" width="80" height="10" rx="4" fill="#1a4a5e" opacity="0.55" />
        <rect x="348" y="294" width="134" height="8" rx="3" fill="#1a4a5e" opacity="0.18" />
        <rect x="348" y="312" width="110" height="8" rx="3" fill="#1a4a5e" opacity="0.14" />
        <rect x="348" y="338" width="64" height="22" rx="6" fill="#e07a4f" />
      </svg>
    </div>
  );
}

function ServiceIcon({ kind }: { kind: "ui" | "front" | "web" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "ui") {
    return (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-beavr" aria-hidden>
        <rect x="6" y="8" width="28" height="20" rx="3" {...common} />
        <path d="M6 14h28" {...common} />
        <rect x="10" y="18" width="10" height="6" rx="1.5" {...common} />
        <path d="M24 19h6M24 23h4" {...common} />
      </svg>
    );
  }

  if (kind === "front") {
    return (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-beavr" aria-hidden>
        <path d="M10 12l-5 8 5 8" {...common} />
        <path d="M30 12l5 8-5 8" {...common} />
        <path d="M22 10l-4 20" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 text-beavr" aria-hidden>
      <circle cx="20" cy="20" r="12" {...common} />
      <path d="M8 20h24" {...common} />
      <path d="M20 8c3.5 3.5 5.5 7.5 5.5 12S23.5 28.5 20 32c-3.5-3.5-5.5-7.5-5.5-12S16.5 11.5 20 8z" {...common} />
    </svg>
  );
}

const services = [
  {
    kind: "ui" as const,
    title: "Diseño de pantallas",
    text: "Interfaces claras y usables: flujos, componentes y sistemas visuales listos para producto.",
  },
  {
    kind: "front" as const,
    title: "Frontend de aplicaciones",
    text: "Implementamos el front con código limpio, accesible y preparado para crecer con tu equipo.",
  },
  {
    kind: "web" as const,
    title: "Páginas web",
    text: "Sitios y landings que presentan bien tu marca y convierten visitas en conversaciones reales.",
  },
];

export default function Home() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="page-shell flex items-center justify-between py-5">
          <a href="#top" className="inline-flex items-center" aria-label="beavr inicio">
            <Image
              src="/logo-full.png"
              alt="beavr"
              width={200}
              height={60}
              priority
              className="h-10 w-auto object-contain sm:h-11 xl:h-12"
            />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-beavr-deep md:flex xl:gap-10 xl:text-base">
            <a href="#servicios" className="transition-opacity hover:opacity-70">
              Servicios
            </a>
            <a href="#enfoque" className="transition-opacity hover:opacity-70">
              Enfoque
            </a>
            <a href="#contacto" className="text-accent transition-opacity hover:opacity-80">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero-canvas relative flex min-h-[100svh] items-center overflow-hidden pt-24">
          <div className="page-shell grid w-full items-center gap-12 pb-16 pt-4 lg:grid-cols-2 lg:gap-16 xl:gap-20 2xl:gap-24 lg:pb-20">
            <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
              <Reveal>
                <h1 className="text-4xl font-bold leading-[1.05] text-beavr-deep sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-[4rem]">
                  Pantallas y frontends que hacen que el producto se entienda
                </h1>
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg xl:mt-6 xl:text-xl">
                  Diseñamos interfaces y construimos frontends para apps y webs que se ven bien y se
                  usan mejor. Menos fricción, más claridad en cada pantalla.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-wrap gap-3 xl:mt-10">
                  <a href="#contacto" className="btn-accent">
                    Hablar de tu proyecto
                  </a>
                  <a href="#servicios" className="btn-ghost">
                    Ver qué hacemos
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={120} className="flex justify-center lg:justify-end">
              <ScreenComposition />
            </Reveal>
          </div>
        </section>

        <section id="servicios" className="section-soft border-t border-line py-20 sm:py-24 xl:py-28">
          <div className="page-shell">
            <Reveal>
              <h2 className="max-w-3xl text-3xl font-bold text-beavr-deep sm:text-4xl xl:text-5xl">
                Tres formas de ayudarte a construir producto digital
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-4 max-w-3xl text-muted xl:text-lg">
                De la idea a la interfaz en producción: diseñamos, maquetamos e implementamos el front
                con el mismo criterio visual.
              </p>
            </Reveal>

            <ul className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8 xl:mt-16 xl:gap-12">
              {services.map((service, index) => (
                <Reveal key={service.title} as="li" delay={index * 100} className="border-t border-line pt-6">
                  <ServiceIcon kind={service.kind} />
                  <h3 className="mt-5 text-xl font-semibold text-beavr-deep xl:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base xl:text-lg">
                    {service.text}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section id="enfoque" className="border-t border-line bg-paper py-20 sm:py-24 xl:py-28">
          <div className="page-shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end xl:gap-20">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-bold text-beavr-deep sm:text-4xl xl:text-5xl">
                Un proceso corto, pensado para decidir rápido
              </h2>
              <p className="mt-4 max-w-xl text-muted xl:text-lg">
                Del primer contacto al frontend en producción, con foco en diseño, claridad y
                resultados visibles.
              </p>
            </Reveal>
            <ol className="space-y-6 xl:space-y-8">
              {[
                {
                  step: "01",
                  title: "Brief claro",
                  text: "Nos cuentas el producto, el público y lo que quieres conseguir.",
                },
                {
                  step: "02",
                  title: "Propuesta de pantallas",
                  text: "Definimos estructura, jerarquía visual y componentes clave.",
                },
                {
                  step: "03",
                  title: "Frontend listo",
                  text: "Implementamos en código lo que se aprobó en diseño.",
                },
              ].map((item, index) => (
                <Reveal key={item.step} as="li" delay={index * 100} className="flex gap-5">
                  <span className="font-display text-sm font-semibold tracking-widest text-accent">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-beavr-deep xl:text-xl">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted sm:text-base xl:text-lg">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section id="contacto" className="border-t border-line bg-mist py-20 sm:py-24 xl:py-28">
          <div className="page-shell grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-24">
            <Reveal>
              <h2 className="text-3xl font-bold text-beavr-deep sm:text-4xl xl:text-5xl">
                Cuéntanos qué quieres construir
              </h2>
              <p className="mt-4 max-w-md text-muted xl:max-w-lg xl:text-lg">
                Déjanos unos detalles del proyecto y te respondemos con una propuesta clara y
                realista.
              </p>
              <div className="mt-10">
                <Image
                  src="/logo-full.png"
                  alt="beavr"
                  width={480}
                  height={150}
                  className="h-20 w-auto object-contain sm:h-24 xl:h-28 2xl:h-32"
                />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-2xl border border-line bg-white/80 p-6 sm:p-8 xl:p-10">
                <LeadForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-beavr-deep text-white">
        <div className="page-shell flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-white/70">Diseño de pantallas y frontends</span>
          <p className="text-sm text-white/55">© {new Date().getFullYear()} beavr — empresa ejemplo</p>
        </div>
      </footer>
    </>
  );
}
