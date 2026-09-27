"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CompanyEditor,
  DeleteCompanyDialog,
  type Company,
  type CompanyFormValues,
} from "@/components/CompanyDialogs";
import { DashboardShell } from "@/components/DashboardShell";
import { EntityLogo } from "@/components/EntityLogo";
import type { Employee } from "@/components/EmployeeDialogs";
import { formatPrice } from "@/lib/crm/money";
import { STAGE_COLORS, STAGE_LABELS, normalizeStage, websiteHref, type Stage } from "@/lib/crm/stages";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type CompanyOpportunity = {
  id: string;
  nombre: string;
  correo: string;
  proyecto: string;
  detalles: string;
  precio: number | null;
  estado: Stage;
  creado_en: string;
  empleado_nombre: string;
};

const supabase = createSupabaseBrowserClient();

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [opportunities, setOpportunities] = useState<CompanyOpportunity[]>([]);
  const [allCompanyNames, setAllCompanyNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [companyResult, employeesResult, namesResult] = await Promise.all([
      supabase.from("empresas").select("*").eq("id", companyId).maybeSingle(),
      supabase.from("personas").select("*").eq("empresa_id", companyId).order("nombre", { ascending: true }),
      supabase.from("empresas").select("id, nombre"),
    ]);

    if (companyResult.error || !companyResult.data) {
      setNotFound(true);
      setCompany(null);
      setEmployees([]);
      setOpportunities([]);
      setLoading(false);
      return;
    }

    const companyData: Company = {
      id: companyResult.data.id,
      nombre: companyResult.data.nombre ?? "Sin nombre",
      nif: companyResult.data.nif ?? null,
      sector: companyResult.data.sector ?? null,
      sitio_web: companyResult.data.sitio_web ?? null,
      notas: companyResult.data.notas ?? null,
      created_at: companyResult.data.created_at,
      updated_at: companyResult.data.updated_at,
    };

    const employeeRows = (employeesResult.data ?? []).map((person) => ({
      id: person.id,
      nombre: person.nombre ?? "Sin nombre",
      email: person.email ?? null,
      empresa_id: person.empresa_id ?? null,
      cargo: person.cargo ?? null,
      telefono: person.telefono ?? null,
      notas: person.notas ?? null,
      created_at: person.created_at,
      updated_at: person.updated_at,
    }));

    const employeeIds = employeeRows.map((employee) => employee.id);
    const employeeById = new Map(employeeRows.map((employee) => [employee.id, employee.nombre]));

    let opportunityRows: CompanyOpportunity[] = [];
    if (employeeIds.length) {
      const opportunitiesResult = await supabase
        .from("oportunidades")
        .select("*")
        .in("persona_id", employeeIds)
        .order("creado_en", { ascending: false });

      if (!opportunitiesResult.error) {
        opportunityRows = (opportunitiesResult.data ?? []).map((row) => ({
          id: row.id,
          nombre: row.nombre ?? "Sin nombre",
          correo: row.correo ?? "Sin correo",
          proyecto: row.proyecto ?? "Sin proyecto",
          detalles: row.detalles ?? "",
          precio: row.precio != null ? Number(row.precio) : null,
          estado: normalizeStage(row.estado),
          creado_en: row.creado_en,
          empleado_nombre: (row.persona_id && employeeById.get(row.persona_id)) || row.nombre || "Empleado",
        }));
      }
    }

    setNotFound(false);
    setCompany(companyData);
    setEmployees(employeeRows);
    setOpportunities(opportunityRows);
    setAllCompanyNames(
      (namesResult.data ?? [])
        .filter((row) => row.id !== companyId)
        .map((row) => row.nombre ?? ""),
    );
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const webHref = useMemo(() => websiteHref(company?.sitio_web), [company?.sitio_web]);

  const handleSave = async (values: CompanyFormValues) => {
    if (!company) return;

    setSaving(true);
    const { error } = await supabase
      .from("empresas")
      .update({
        nombre: values.nombre,
        nif: values.nif || null,
        sector: values.sector || null,
        sitio_web: values.sitio_web || null,
        notas: values.notas || null,
      })
      .eq("id", company.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido guardar la empresa. Inténtalo de nuevo." });
      return;
    }

    setEditorOpen(false);
    setNotice({ type: "success", text: `Cambios guardados en «${values.nombre}».` });
    load();
  };

  const handleDelete = async () => {
    if (!company) return;

    setSaving(true);
    const { error } = await supabase.from("empresas").delete().eq("id", company.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido eliminar la empresa. Inténtalo de nuevo." });
      return;
    }

    router.push("/?vista=empresas");
  };

  if (loading) {
    return (
      <DashboardShell title="Empresa" subtitle="Cargando ficha">
        <div className="empty-column">Cargando...</div>
      </DashboardShell>
    );
  }

  if (notFound || !company) {
    return (
      <DashboardShell title="Empresa" subtitle="No encontrada">
        <div className="empty-state">
          <p>No encontramos esta empresa.</p>
          <Link href="/?vista=empresas" className="btn btn-primary">
            Volver a empresas
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={company.nombre} subtitle="Ficha de la empresa">
      <div className="entity-detail">
        <div className="entity-detail-toolbar">
          <Link href="/?vista=empresas" className="back-link">
            ← Volver a empresas
          </Link>
          <div className="entity-detail-actions">
            <button type="button" className="btn btn-soft" onClick={() => setEditorOpen(true)}>
              Editar
            </button>
            <button type="button" className="btn btn-danger-soft" onClick={() => setDeleteOpen(true)}>
              Eliminar
            </button>
          </div>
        </div>

        {notice && (
          <div className={`notice notice-${notice.type}`} role="status">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        <section className="entity-hero" aria-label="Datos de la empresa">
          <EntityLogo name={company.nombre} size="lg" />
          <div className="entity-hero-copy">
            <h2>{company.nombre}</h2>
            {company.sector && <span className="company-sector">{company.sector}</span>}
          </div>
        </section>

        <section className="detail-grid" aria-label="Información general">
          <article className="detail-card">
            <h3>Datos</h3>
            <dl className="detail-facts">
              <div>
                <dt>NIF</dt>
                <dd>{company.nif || "—"}</dd>
              </div>
              <div>
                <dt>Sector</dt>
                <dd>{company.sector || "—"}</dd>
              </div>
              <div>
                <dt>Página web</dt>
                <dd>
                  {webHref ? (
                    <a href={webHref} target="_blank" rel="noopener noreferrer">
                      {company.sitio_web}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </article>

          <article className="detail-card">
            <h3>Notas</h3>
            {company.notas ? <p className="detail-notes">{company.notas}</p> : <p className="is-empty">Sin notas</p>}
          </article>
        </section>

        <section className="detail-card" aria-label="Empleados de la empresa">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Empleados</h3>
              <span>{employees.length}</span>
            </div>
          </div>

          {employees.length ? (
            <div className="entity-select-grid">
              {employees.map((employee) => (
                <Link key={employee.id} href={`/empleados/${employee.id}`} className="entity-select-card">
                  <EntityLogo name={employee.nombre} />
                  <div className="entity-select-copy">
                    <strong>{employee.nombre}</strong>
                    <span>{employee.cargo || "Sin cargo"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-column">Esta empresa todavía no tiene empleados</div>
          )}
        </section>

        <section className="detail-card" aria-label="Oportunidades de los empleados">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Oportunidades de los empleados</h3>
              <span>{opportunities.length}</span>
            </div>
          </div>

          {opportunities.length ? (
            <div className="related-opp-list">
              {opportunities.map((opp) => (
                <Link key={opp.id} href={`/oportunidades/${opp.id}`} className="related-opp-card">
                  <div className="related-opp-copy">
                    <strong>{opp.nombre}</strong>
                    <span>
                      {opp.proyecto} · {opp.empleado_nombre}
                    </span>
                    <span className="related-opp-price">{formatPrice(opp.precio) ?? "Sin precio"}</span>
                  </div>
                  <span
                    className="status-pill"
                    style={{
                      background: STAGE_COLORS[opp.estado].background,
                      color: STAGE_COLORS[opp.estado].color,
                    }}
                  >
                    {STAGE_LABELS[opp.estado]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-column">Todavía no hay oportunidades de los empleados de esta empresa</div>
          )}
        </section>
      </div>

      {editorOpen && (
        <CompanyEditor
          company={company}
          existingNames={allCompanyNames}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteCompanyDialog
          company={company}
          employeesCount={employees.length}
          opportunitiesCount={opportunities.length}
          deleting={saving}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </DashboardShell>
  );
}
