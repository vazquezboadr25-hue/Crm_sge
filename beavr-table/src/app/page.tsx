"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CompanyEditor, type Company, type CompanyFormValues } from "@/components/CompanyDialogs";
import { CrmSummary } from "@/components/CrmSummary";
import { DashboardShell } from "@/components/DashboardShell";
import { EmployeeEditor, type Employee, type EmployeeFormValues } from "@/components/EmployeeDialogs";
import { EntityLogo } from "@/components/EntityLogo";
import { formatPrice } from "@/lib/crm/money";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_ORDER,
  normalizeStage,
  type Stage,
} from "@/lib/crm/stages";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Opportunity = {
  id: string;
  nombre: string;
  empresa: string;
  empresa_id: string | null;
  persona_id: string | null;
  proyecto: string;
  email: string;
  detalles: string;
  precio: number | null;
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
  precio: number | string | null;
  estado: Stage | string | null;
  creado_en: string;
};

type SortMode = "default" | "az" | "za";

const supabase = createSupabaseBrowserClient();

const STAGE_COLUMNS = STAGE_ORDER.map((stage) => ({
  key: stage,
  label: STAGE_LABELS[stage],
}));

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

function resolveView(vista: string | null): "summary" | "opportunities" | "people" | "companies" {
  switch (vista) {
    case "oportunidades":
      return "opportunities";
    case "empleados":
      return "people";
    case "empresas":
      return "companies";
    default:
      return "summary";
  }
}

function SortControls({
  value,
  onChange,
  label,
}: {
  value: SortMode;
  onChange: (value: SortMode) => void;
  label: string;
}) {
  return (
    <div className="sort-controls" role="group" aria-label={label}>
      <span className="sort-label">Orden:</span>
      <button
        type="button"
        className={`sort-chip ${value === "default" ? "active" : ""}`}
        onClick={() => onChange("default")}
      >
        Por defecto
      </button>
      <button
        type="button"
        className={`sort-chip ${value === "az" ? "active" : ""}`}
        onClick={() => onChange("az")}
      >
        A → Z
      </button>
      <button
        type="button"
        className={`sort-chip ${value === "za" ? "active" : ""}`}
        onClick={() => onChange("za")}
      >
        Z → A
      </button>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const activeView = resolveView(searchParams.get("vista"));

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [empresaRecords, setEmpresaRecords] = useState<Company[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeesSearch, setEmployeesSearch] = useState("");
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [employeesSort, setEmployeesSort] = useState<SortMode>("default");
  const [companiesSort, setCompaniesSort] = useState<SortMode>("default");
  const [companyEditorOpen, setCompanyEditorOpen] = useState(false);
  const [employeeEditorOpen, setEmployeeEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);

    const [companiesResult, peopleResult, opportunitiesResult] = await Promise.all([
      supabase.from("empresas").select("*").order("created_at", { ascending: true }),
      supabase.from("personas").select("*").order("created_at", { ascending: true }),
      supabase.from("oportunidades").select("*").order("creado_en", { ascending: false }),
    ]);

    if (companiesResult.error) {
      console.error("Error cargando empresas:", companiesResult.error);
    }

    if (peopleResult.error) {
      console.error("Error cargando empleados:", peopleResult.error);
    }

    if (opportunitiesResult.error) {
      console.error("Error cargando oportunidades:", opportunitiesResult.error);
      setOpportunities([]);
      setEmpresaRecords([]);
      setEmployeeRecords([]);
      setLoading(false);
      return;
    }

    const companies = companiesResult.data ?? [];
    const people = peopleResult.data ?? [];
    const companyById = new Map(companies.map((company) => [company.id, company.nombre]));
    const personById = new Map(
      people.map((person) => [
        person.id,
        {
          nombre: person.nombre ?? "Sin nombre",
          email: person.email ?? "Sin email",
          empresa: companyById.get(person.empresa_id) ?? "Sin empresa",
        },
      ]),
    );

    setEmpresaRecords(
      companies.map((company) => ({
        id: company.id,
        nombre: company.nombre ?? "Sin nombre",
        nif: company.nif ?? null,
        sector: company.sector ?? null,
        sitio_web: company.sitio_web ?? null,
        notas: company.notas ?? null,
        created_at: company.created_at,
        updated_at: company.updated_at,
      })),
    );
    setEmployeeRecords(
      people.map((person) => ({
        id: person.id,
        nombre: person.nombre ?? "Sin nombre",
        email: person.email ?? null,
        empresa_id: person.empresa_id ?? null,
        cargo: person.cargo ?? null,
        telefono: person.telefono ?? null,
        notas: person.notas ?? null,
        created_at: person.created_at,
        updated_at: person.updated_at,
      })),
    );

    const mapped = (opportunitiesResult.data ?? []).map(
      (row: SupabaseOpportunity & { empresa_id?: string | null; persona_id?: string | null }) => {
        const linkedPerson = row.persona_id ? personById.get(row.persona_id) : null;
        const linkedCompany = row.empresa_id ? companyById.get(row.empresa_id) : null;
        const empresa = row.empresa ?? linkedCompany ?? linkedPerson?.empresa ?? "Sin empresa";

        return {
          id: row.id,
          nombre: row.nombre ?? linkedPerson?.nombre ?? "Sin nombre",
          empresa,
          empresa_id: row.empresa_id ?? null,
          persona_id: row.persona_id ?? null,
          proyecto: row.proyecto ?? "Sin proyecto",
          email: row.correo ?? linkedPerson?.email ?? "Sin email",
          detalles: row.detalles ?? "Sin detalles",
          precio: row.precio != null ? Number(row.precio) : null,
          estado: normalizeStage(row.estado as string | null | undefined),
          creado_en: row.creado_en ?? new Date().toISOString(),
        };
      },
    );

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
      if (!query) return true;
      return [opp.nombre, opp.empresa, opp.email, opp.proyecto, opp.detalles].join(" ").toLowerCase().includes(query);
    });
  }, [opportunities, searchTerm]);

  const total = opportunities.length;
  const nuevas = opportunities.filter((o) => o.estado === "new").length;
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

  const filteredEmployees = useMemo(() => {
    const query = employeesSearch.trim().toLowerCase();
    const list = employeeRecords
      .map((employee) => ({
        ...employee,
        empresa: empresaRecords.find((company) => company.id === employee.empresa_id)?.nombre ?? null,
      }))
      .filter((employee) => {
        if (!query) return true;
        return [employee.nombre, employee.email, employee.empresa, employee.cargo, employee.telefono]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

    if (employeesSort === "az") {
      return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    if (employeesSort === "za") {
      return [...list].sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    }
    return list;
  }, [employeeRecords, empresaRecords, employeesSearch, employeesSort]);

  const filteredCompanies = useMemo(() => {
    const query = companiesSearch.trim().toLowerCase();
    const list = empresaRecords.filter((company) => {
      if (!query) return true;
      const employeesText = employeeRecords
        .filter((employee) => employee.empresa_id === company.id)
        .map((employee) => `${employee.nombre} ${employee.email ?? ""}`)
        .join(" ");
      return `${company.nombre} ${company.nif ?? ""} ${company.sector ?? ""} ${employeesText}`
        .toLowerCase()
        .includes(query);
    });

    if (companiesSort === "az") {
      return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    if (companiesSort === "za") {
      return [...list].sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    }
    return list;
  }, [empresaRecords, employeeRecords, companiesSearch, companiesSort]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSaveCompany = async (values: CompanyFormValues) => {
    setSaving(true);
    const { error } = await supabase.from("empresas").insert({
      nombre: values.nombre,
      nif: values.nif || null,
      sector: values.sector || null,
      sitio_web: values.sitio_web || null,
      notas: values.notas || null,
    });
    setSaving(false);

    if (error) {
      console.error("Error guardando empresa:", error);
      setNotice({ type: "error", text: "No se ha podido guardar la empresa. Inténtalo de nuevo." });
      return;
    }

    setCompanyEditorOpen(false);
    setNotice({ type: "success", text: `Empresa «${values.nombre}» añadida.` });
    fetchData();
  };

  const handleSaveEmployee = async (values: EmployeeFormValues) => {
    setSaving(true);
    const { error } = await supabase.from("personas").insert({
      nombre: values.nombre,
      email: values.email || null,
      empresa_id: values.empresa_id || null,
      cargo: values.cargo || null,
      telefono: values.telefono || null,
      notas: values.notas || null,
    });
    setSaving(false);

    if (error) {
      console.error("Error guardando empleado:", error);
      setNotice({ type: "error", text: "No se ha podido guardar el empleado. Inténtalo de nuevo." });
      return;
    }

    setEmployeeEditorOpen(false);
    setNotice({ type: "success", text: `Empleado «${values.nombre}» añadido.` });
    fetchData();
  };

  const noticeBanner = notice && (
    <div className={`notice notice-${notice.type}`} role="status">
      <span>{notice.text}</span>
      <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );

  const handleDrop = async (nextStage: Stage) => {
    if (!draggedId) return;

    const nextOpportunities = opportunities.map((opp) =>
      opp.id === draggedId ? { ...opp, estado: nextStage } : opp,
    );
    setOpportunities(nextOpportunities);
    setDraggedId(null);

    const { error } = await supabase.from("oportunidades").update({ estado: nextStage }).eq("id", draggedId);

    if (error) {
      console.error("Error actualizando estado:", error);
      fetchData();
    }
  };

  const titles = {
    summary: { title: "Resumen", subtitle: "Estadísticas de negociaciones" },
    opportunities: { title: "Oportunidades", subtitle: "Pulsa una oportunidad para ver su ficha" },
    people: { title: "Empleados", subtitle: "Pulsa un empleado para ver su ficha" },
    companies: { title: "Empresas", subtitle: "Pulsa una empresa para ver su ficha" },
  } as const;

  return (
    <DashboardShell title={titles[activeView].title} subtitle={titles[activeView].subtitle}>
      {activeView === "summary" && (
        <CrmSummary
          opportunities={opportunities}
          loading={loading}
          companyCount={empresaRecords.length}
          employeeCount={employeeRecords.length}
        />
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
                placeholder="Buscar proyecto o empresa..."
                aria-label="Buscar oportunidad"
              />
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
                    <Link
                      key={opp.id}
                      href={`/oportunidades/${opp.id}`}
                      className="kanban-card kanban-card-compact"
                      draggable
                      onDragStart={(event) => {
                        setDraggedId(opp.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", opp.id);
                      }}
                      onDragEnd={() => setDraggedId(null)}
                    >
                      <div className="card-name">{opp.nombre}</div>
                      <div className="card-project">{opp.proyecto}</div>
                      <div className="card-price">{formatPrice(opp.precio) ?? "Sin precio"}</div>
                      <div className="card-meta-row">
                        <span className="card-company">{opp.empresa}</span>
                        <span
                          className="status-pill card-status"
                          style={{
                            background: STAGE_COLORS[opp.estado].background,
                            color: STAGE_COLORS[opp.estado].color,
                          }}
                        >
                          {STAGE_LABELS[opp.estado]}
                        </span>
                      </div>
                    </Link>
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
        <section className="directory-section" aria-label="Empleados">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Empleados</h3>
              <span>{filteredEmployees.length}</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setEmployeeEditorOpen(true)}>
              + Añadir empleado
            </button>
          </div>

          {noticeBanner}

          <div className="directory-tools">
            <div className="directory-search-box">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={employeesSearch}
                onChange={(event) => setEmployeesSearch(event.target.value)}
                placeholder="Buscar empleado, cargo, correo o empresa..."
                aria-label="Buscar empleados"
              />
            </div>
            <SortControls value={employeesSort} onChange={setEmployeesSort} label="Orden de empleados" />
          </div>

          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : filteredEmployees.length ? (
            <div className="entity-select-grid">
              {filteredEmployees.map((employee) => (
                <Link key={employee.id} href={`/empleados/${employee.id}`} className="entity-select-card">
                  <EntityLogo name={employee.nombre} />
                  <div className="entity-select-copy">
                    <strong>{employee.nombre}</strong>
                    <span>{employee.empresa || "Sin empresa"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : employeesSearch.trim() ? (
            <div className="empty-column">Ningún empleado coincide con la búsqueda</div>
          ) : (
            <div className="empty-state">
              <p>Todavía no hay empleados registrados.</p>
              <button type="button" className="btn btn-primary" onClick={() => setEmployeeEditorOpen(true)}>
                + Añadir el primer empleado
              </button>
            </div>
          )}
        </section>
      )}

      {activeView === "companies" && (
        <section className="directory-section" aria-label="Empresas">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Empresas</h3>
              <span>{filteredCompanies.length}</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setCompanyEditorOpen(true)}>
              + Añadir empresa
            </button>
          </div>

          {noticeBanner}

          <div className="directory-tools">
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
                placeholder="Buscar empresa, NIF, sector o empleado..."
                aria-label="Buscar empresas"
              />
            </div>
            <SortControls value={companiesSort} onChange={setCompaniesSort} label="Orden de empresas" />
          </div>

          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : filteredCompanies.length ? (
            <div className="entity-select-grid">
              {filteredCompanies.map((company) => (
                <Link key={company.id} href={`/empresas/${company.id}`} className="entity-select-card">
                  <EntityLogo name={company.nombre} />
                  <div className="entity-select-copy">
                    <strong>{company.nombre}</strong>
                  </div>
                </Link>
              ))}
            </div>
          ) : companiesSearch.trim() ? (
            <div className="empty-column">Ninguna empresa coincide con la búsqueda</div>
          ) : (
            <div className="empty-state">
              <p>Todavía no hay empresas registradas.</p>
              <button type="button" className="btn btn-primary" onClick={() => setCompanyEditorOpen(true)}>
                + Añadir la primera empresa
              </button>
            </div>
          )}
        </section>
      )}

      {companyEditorOpen && (
        <CompanyEditor
          company={null}
          existingNames={empresaRecords.map((company) => company.nombre)}
          saving={saving}
          onSave={handleSaveCompany}
          onClose={() => setCompanyEditorOpen(false)}
        />
      )}

      {employeeEditorOpen && (
        <EmployeeEditor
          employee={null}
          companies={empresaRecords}
          existingEmails={employeeRecords.filter((employee) => employee.email).map((employee) => employee.email as string)}
          saving={saving}
          onSave={handleSaveEmployee}
          onClose={() => setEmployeeEditorOpen(false)}
        />
      )}
    </DashboardShell>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-shell">
          <main className="main-panel">
            <div className="empty-column">Cargando...</div>
          </main>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
