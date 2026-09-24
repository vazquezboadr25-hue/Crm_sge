"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type Stage = "new" | "contacted" | "proposal" | "won" | "lost";

type Opportunity = {
  id: string;
  nombre: string;
  empresa: string;
  proyecto: string;
  email: string;
  detalles: string;
  estado: Stage;
  creado_en: string;
};

type SupabaseOpportunity = {
  id: string;
  nombre: string;
  empresa: string | null;
  proyecto: string;
  correo: string;
  detalles: string;
  estado: Stage | string | null;
  creado_en: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const STAGE_LABELS: Record<Stage, string> = {
  new: "Nueva",
  contacted: "Contactada",
  proposal: "Propuesta",
  won: "Ganada",
  lost: "Perdida",
};

const STAGE_ORDER: Stage[] = ["new", "contacted", "proposal", "won", "lost"];

const STAGE_COLUMNS = STAGE_ORDER.map((stage) => ({
  key: stage,
  label: STAGE_LABELS[stage],
}));

function normalizeStage(value: string | null | undefined): Stage {
  const normalized = (value ?? "new").toLowerCase();

  switch (normalized) {
    case "nueva":
    case "new":
      return "new";
    case "contactada":
    case "contacted":
      return "contacted";
    case "propuesta":
    case "proposal":
      return "proposal";
    case "ganada":
    case "won":
      return "won";
    case "perdida":
    case "lost":
      return "lost";
    default:
      return "new";
  }
}

const STAGE_COLORS: Record<Stage, { background: string; color: string }> = {
  new: { background: "#e2e8dd", color: "#5a6b47" },
  contacted: { background: "#dbe7ea", color: "#1a4a5e" },
  proposal: { background: "#f4e2c8", color: "#8c5f1e" },
  won: { background: "#dcefe1", color: "#2f6b45" },
  lost: { background: "#f3dbd4", color: "#a5432c" },
};

function formatRelative(dateIso: string) {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 24) {
    const hours = Math.max(1, Math.round(diffHours));
    return `${hours} h`;
  }

  if (diffDays < 7) {
    const days = Math.round(diffDays);
    return `${days} d`;
  }

  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [empresaRecords, setEmpresaRecords] = useState<Array<{ id: string; nombre: string }>>([]);
  const [personaRecords, setPersonaRecords] = useState<Array<{ id: string; nombre: string; email: string; empresa_id: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"summary" | "opportunities" | "people" | "companies">("summary");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);

    const [companiesResult, peopleResult, opportunitiesResult] = await Promise.all([
      supabase.from("empresas").select("*").order("nombre", { ascending: true }),
      supabase.from("personas").select("*").order("nombre", { ascending: true }),
      supabase.from("oportunidades").select("*").order("creado_en", { ascending: false }),
    ]);

    if (companiesResult.error) {
      console.error("Error cargando empresas:", companiesResult.error);
    }

    if (peopleResult.error) {
      console.error("Error cargando personas:", peopleResult.error);
    }

    if (opportunitiesResult.error) {
      console.error("Error cargando oportunidades:", opportunitiesResult.error);
      setOpportunities([]);
      setEmpresaRecords([]);
      setPersonaRecords([]);
      setLoading(false);
      return;
    }

    const companies = companiesResult.data ?? [];
    const people = peopleResult.data ?? [];
    const companyById = new Map(companies.map((company) => [company.id, company.nombre]));
    const personById = new Map(
      people.map((person) => [person.id, { nombre: person.nombre ?? "Sin nombre", email: person.email ?? "Sin email", empresa: companyById.get(person.empresa_id) ?? "Sin empresa" }]),
    );

    setEmpresaRecords(companies.map((company) => ({ id: company.id, nombre: company.nombre ?? "Sin empresa" })));
    setPersonaRecords(
      people.map((person) => ({
        id: person.id,
        nombre: person.nombre ?? "Sin nombre",
        email: person.email ?? "Sin email",
        empresa_id: person.empresa_id ?? null,
      })),
    );

    const mapped = (opportunitiesResult.data ?? []).map((row: SupabaseOpportunity & { empresa_id?: string | null; persona_id?: string | null }) => {
      const linkedPerson = row.persona_id ? personById.get(row.persona_id) : null;
      const linkedCompany = row.empresa_id ? companyById.get(row.empresa_id) : null;
      const empresa = row.empresa ?? linkedCompany ?? linkedPerson?.empresa ?? "Sin empresa";

      return {
        id: row.id,
        nombre: row.nombre ?? linkedPerson?.nombre ?? "Sin nombre",
        empresa,
        proyecto: row.proyecto ?? "Sin proyecto",
        email: row.correo ?? linkedPerson?.email ?? "Sin email",
        detalles: row.detalles ?? "Sin detalles",
        estado: normalizeStage(row.estado as string | null | undefined),
        creado_en: row.creado_en ?? new Date().toISOString(),
      };
    });

    setOpportunities(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("oportunidades-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oportunidades" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOpportunities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return opportunities.filter((opp) => {
      const matchesSearch =
        query.length === 0 ||
        [opp.nombre, opp.empresa, opp.email, opp.proyecto, opp.detalles]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStage = stageFilter === "all" || opp.estado === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [opportunities, searchTerm, stageFilter]);

  const total = opportunities.length;
  const nuevas = opportunities.filter((o) => o.estado === "new").length;
  const contactadas = opportunities.filter((o) => o.estado === "contacted").length;
  const propuestas = opportunities.filter((o) => o.estado === "proposal").length;
  const ganadas = opportunities.filter((o) => o.estado === "won").length;
  const perdidas = opportunities.filter((o) => o.estado === "lost").length;
  const empresas = new Set(opportunities.map((o) => o.empresa)).size;
  const ultima = opportunities[0] ? formatRelative(opportunities[0].creado_en) : "—";

  const grouped = useMemo(() => {
    return STAGE_ORDER.reduce(
      (acc, stage) => {
        acc[stage] = filteredOpportunities.filter((opp) => opp.estado === stage);
        return acc;
      },
      {} as Record<Stage, Opportunity[]>,
    );
  }, [filteredOpportunities]);

  const selectedOpportunity =
    opportunities.find((opp) => opp.id === selectedOpportunityId) ?? null;

  const peopleDirectory = useMemo(() => {
    if (personaRecords.length) {
      return personaRecords
        .map((person) => ({
          nombre: person.nombre,
          email: person.email,
          empresa: empresaRecords.find((company) => company.id === person.empresa_id)?.nombre ?? "Sin empresa",
          estado: "new" as Stage,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const map = new Map<string, { nombre: string; email: string; empresa: string; estado: Stage }>();

    opportunities.forEach((opp) => {
      const key = `${opp.nombre.trim().toLowerCase()}|${opp.email.trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          nombre: opp.nombre,
          email: opp.email,
          empresa: opp.empresa,
          estado: opp.estado,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [personaRecords, empresaRecords, opportunities]);

  const companiesDirectory = useMemo(() => {
    if (empresaRecords.length) {
      return empresaRecords
        .map((company) => ({
          nombre: company.nombre,
          personas: personaRecords
            .filter((person) => person.empresa_id === company.id)
            .map((person) => ({
              nombre: person.nombre,
              email: person.email,
              estado: "new" as Stage,
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const map = new Map<string, { nombre: string; personas: Array<{ nombre: string; email: string; estado: Stage }> }>();

    opportunities.forEach((opp) => {
      const companyName = opp.empresa || "Sin empresa";
      if (!map.has(companyName)) {
        map.set(companyName, { nombre: companyName, personas: [] });
      }

      const company = map.get(companyName)!;
      const personKey = `${opp.nombre.trim().toLowerCase()}|${opp.email.trim().toLowerCase()}`;

      const alreadyExists = company.personas.some(
        (person) => `${person.nombre.trim().toLowerCase()}|${person.email.trim().toLowerCase()}` === personKey,
      );

      if (!alreadyExists) {
        company.personas.push({
          nombre: opp.nombre,
          email: opp.email,
          estado: opp.estado,
        });
      }
    });

    return Array.from(map.values())
      .map((company) => ({
        ...company,
        personas: company.personas.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [empresaRecords, personaRecords, opportunities]);

  const filteredPeople = useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    return peopleDirectory.filter((person) => {
      if (!query) return true;
      return [person.nombre, person.email, person.empresa].join(" ").toLowerCase().includes(query);
    });
  }, [peopleDirectory, peopleSearch]);

  const filteredCompanies = useMemo(() => {
    const query = companiesSearch.trim().toLowerCase();
    return companiesDirectory.filter((company) => {
      if (!query) return true;
      const peopleText = company.personas
        .map((person) => `${person.nombre} ${person.email}`)
        .join(" ")
        .toLowerCase();
      return `${company.nombre} ${peopleText}`.includes(query);
    });
  }, [companiesDirectory, companiesSearch]);

  const handleDrop = async (nextStage: Stage) => {
    if (!draggedId) return;

    const nextOpportunities = opportunities.map((opp) =>
      opp.id === draggedId ? { ...opp, estado: nextStage } : opp,
    );
    setOpportunities(nextOpportunities);
    setDraggedId(null);

    const { error } = await supabase
      .from("oportunidades")
      .update({ estado: nextStage })
      .eq("id", draggedId);

    if (error) {
      console.error("Error actualizando estado:", error);
      fetchData();
    }
  };

  const handleStatusChange = async (nextStage: Stage) => {
    if (!selectedOpportunityId) return;

    setOpportunities((current) =>
      current.map((opp) =>
        opp.id === selectedOpportunityId ? { ...opp, estado: nextStage } : opp,
      ),
    );

    const { error } = await supabase
      .from("oportunidades")
      .update({ estado: nextStage })
      .eq("id", selectedOpportunityId);

    if (error) {
      console.error("Error actualizando estado del detalle:", error);
      fetchData();
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <img src="/logo-full.png" alt="beavr" className="brand-logo" />
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          <button
            type="button"
            className={`nav-item ${activeView === "summary" ? "active" : ""}`}
            onClick={() => setActiveView("summary")}
          >
            <span className="nav-dot" />
            Resumen
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === "opportunities" ? "active" : ""}`}
            onClick={() => setActiveView("opportunities")}
          >
            <span className="nav-dot" />
            Oportunidades
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === "people" ? "active" : ""}`}
            onClick={() => setActiveView("people")}
          >
            <span className="nav-dot" />
            Personas
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === "companies" ? "active" : ""}`}
            onClick={() => setActiveView("companies")}
          >
            <span className="nav-dot" />
            Empresas
          </button>
        </nav>

        <div className="sidebar-foot">
          <div>beavr</div>
          <div>CRM de oportunidades</div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>
              {activeView === "summary" && "Resumen"}
              {activeView === "opportunities" && "Oportunidades"}
              {activeView === "people" && "Personas"}
              {activeView === "companies" && "Empresas"}
            </h1>
            <p>
              {activeView === "summary" && "Vista general del pipeline"}
              {activeView === "opportunities" && "Seguimiento del pipeline por estado"}
              {activeView === "people" && "Listado de personas asociadas"}
              {activeView === "companies" && "Listado de empresas y personas"}
            </p>
          </div>
        </header>

        {activeView === "summary" && (
          <section className="summary-page" aria-label="Resumen general">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total</span>
                <strong>{total}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Nuevas</span>
                <strong>{nuevas}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Contactadas</span>
                <strong>{contactadas}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Propuestas</span>
                <strong>{propuestas}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Ganadas</span>
                <strong>{ganadas}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Perdidas</span>
                <strong>{perdidas}</strong>
              </div>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <h2>Últimas oportunidades</h2>
              </div>

              {loading ? (
                <div className="empty-column">Cargando...</div>
              ) : opportunities.length ? (
                <div className="summary-table-wrap">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.slice(0, 8).map((opp) => (
                        <tr key={opp.id}>
                          <td className="summary-name">{opp.nombre}</td>
                          <td className="summary-email">{opp.email}</td>
                          <td className="summary-description">
                            {opp.empresa ? `${opp.empresa} — ${opp.detalles || opp.proyecto}` : opp.detalles || opp.proyecto}
                          </td>
                          <td className="summary-status-cell">
                            <span
                              className="status-pill"
                              style={{
                                background: STAGE_COLORS[opp.estado].background,
                                color: STAGE_COLORS[opp.estado].color,
                              }}
                            >
                              {STAGE_LABELS[opp.estado]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-column">No hay oportunidades todavía</div>
              )}
            </div>
          </section>
        )}

        {activeView === "opportunities" && (
          <>
            <section className="stats-grid" aria-label="Estadísticas principales">
              <article className="stat-card">
                <div className="stat-number">{total}</div>
                <div className="stat-label">Total</div>
              </article>
              <article className="stat-card">
                <div className="stat-number">{nuevas}</div>
                <div className="stat-label">Nuevas</div>
              </article>
              <article className="stat-card">
                <div className="stat-number">{empresas}</div>
                <div className="stat-label">Empresas</div>
              </article>
              <article className="stat-card">
                <div className="stat-number">{ultima}</div>
                <div className="stat-label">Última</div>
              </article>
            </section>

            <section className="board-toolbar" aria-label="Herramientas del tablero">
              <div className="search-box">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar nombre, empresa, email..."
                  aria-label="Buscar oportunidad"
                />
              </div>

              <div className="filter-row" aria-label="Filtrar por estado">
                <button
                  type="button"
                  className={`filter-chip ${stageFilter === "all" ? "active" : ""}`}
                  onClick={() => setStageFilter("all")}
                >
                  Todos
                </button>
                {STAGE_COLUMNS.map((column) => (
                  <button
                    key={column.key}
                    type="button"
                    className={`filter-chip ${stageFilter === column.key ? "active" : ""}`}
                    onClick={() => setStageFilter(column.key)}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="board-wrapper">
              {STAGE_COLUMNS.map((column) => (
                <div
                  key={column.key}
                  className="board-column"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(column.key)}
                >
                  <div className="board-header">
                    <h3>{column.label}</h3>
                    <span>{grouped[column.key]?.length ?? 0}</span>
                  </div>

                  {loading ? (
                    <div className="empty-column">Cargando...</div>
                  ) : grouped[column.key]?.length ? (
                    grouped[column.key].map((opp) => (
                      <article
                        key={opp.id}
                        className={`kanban-card ${selectedOpportunityId === opp.id ? "selected" : ""}`}
                        draggable
                        onDragStart={() => setDraggedId(opp.id)}
                        onDragEnd={() => setDraggedId(null)}
                        onClick={() => setSelectedOpportunityId(opp.id)}
                      >
                        <div className="card-company">{opp.empresa}</div>
                        <div className="card-name">{opp.nombre}</div>
                        <div className="card-project">{opp.proyecto}</div>
                        <div className="card-foot">
                          <span className="card-email">{opp.email}</span>
                          <span className="card-time">{formatRelative(opp.creado_en)}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-column">Sin registros</div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}

        {activeView === "people" && (
          <section className="directory-section" aria-label="Personas">
            <div className="directory-header">
              <h3>Personas</h3>
              <span>{filteredPeople.length}</span>
            </div>

            <div className="directory-search-box">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={peopleSearch}
                onChange={(event) => setPeopleSearch(event.target.value)}
                placeholder="Buscar persona, email o empresa..."
                aria-label="Buscar personas"
              />
            </div>

            {filteredPeople.length ? (
              <div className="directory-grid">
                {filteredPeople.map((person) => (
                  <article key={`${person.nombre}-${person.email}`} className="directory-card">
                    <div className="directory-name">{person.nombre}</div>
                    <div className="directory-meta">{person.email}</div>
                    <div className="directory-company">{person.empresa}</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-column">No hay personas registradas</div>
            )}
          </section>
        )}

        {activeView === "companies" && (
          <section className="directory-section" aria-label="Empresas">
            <div className="directory-header">
              <h3>Empresas</h3>
              <span>{filteredCompanies.length}</span>
            </div>

            <div className="directory-search-box">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={companiesSearch}
                onChange={(event) => setCompaniesSearch(event.target.value)}
                placeholder="Buscar empresa o persona..."
                aria-label="Buscar empresas"
              />
            </div>

            {filteredCompanies.length ? (
              <div className="company-list">
                {filteredCompanies.map((company) => {
                  const isExpanded = expandedCompanies[company.nombre] ?? false;

                  return (
                    <article key={company.nombre} className="company-card">
                      <button
                        type="button"
                        className="company-toggle"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedCompanies((current) => ({
                            ...current,
                            [company.nombre]: !current[company.nombre],
                          }))
                        }
                      >
                        <span className="company-name">{company.nombre}</span>
                        <span className="company-toggle-icon">{isExpanded ? "−" : "+"}</span>
                      </button>

                      {isExpanded && (
                        <div className="company-people">
                          {company.personas.map((person) => (
                            <div key={`${company.nombre}-${person.nombre}-${person.email}`} className="company-person">
                              <span>{person.nombre}</span>
                              <small>{person.email}</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-column">No hay empresas registradas</div>
            )}
          </section>
        )}

        {selectedOpportunity && (
          <aside className="detail-panel" aria-label="Detalle de oportunidad">
            <div className="detail-panel-header">
              <div>
                <div className="detail-label">Oportunidad</div>
                <h3>{selectedOpportunity.nombre}</h3>
              </div>
              <button
                type="button"
                className="detail-close"
                onClick={() => setSelectedOpportunityId(null)}
                aria-label="Cerrar detalle"
              >
                ×
              </button>
            </div>

            <div className="detail-section">
              <div className="detail-row">
                <span>Empresa</span>
                <strong>{selectedOpportunity.empresa}</strong>
              </div>
              <div className="detail-row">
                <span>Correo</span>
                <strong>{selectedOpportunity.email}</strong>
              </div>
              <div className="detail-row">
                <span>Proyecto</span>
                <strong>{selectedOpportunity.proyecto}</strong>
              </div>
            </div>

            <div className="detail-block">
              <h4>Descripción</h4>
              <p>{selectedOpportunity.detalles}</p>
            </div>

            <div className="detail-block">
              <h4>Cambiar estado</h4>
              <div className="detail-status-list">
                {STAGE_COLUMNS.map((column) => (
                  <button
                    key={column.key}
                    type="button"
                    className={`detail-status-btn ${selectedOpportunity.estado === column.key ? "active" : ""}`}
                    onClick={() => handleStatusChange(column.key)}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
