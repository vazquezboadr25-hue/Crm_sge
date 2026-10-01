"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Company } from "@/components/CompanyDialogs";
import { DashboardShell } from "@/components/DashboardShell";
import {
  DeleteEmployeeDialog,
  EmployeeEditor,
  type Employee,
  type EmployeeFormValues,
} from "@/components/EmployeeDialogs";
import { EntityLogo } from "@/components/EntityLogo";
import { formatPrice } from "@/lib/crm/money";
import { STAGE_COLORS, STAGE_LABELS, normalizeStage, type Stage } from "@/lib/crm/stages";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type EmployeeOpportunity = {
  id: string;
  nombre: string;
  correo: string;
  proyecto: string;
  detalles: string;
  precio: number | null;
  estado: Stage;
  creado_en: string;
};

const supabase = createSupabaseBrowserClient();

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; nombre: string }>>([]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<EmployeeOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [employeeResult, companiesResult, emailsResult, opportunitiesResult] = await Promise.all([
      supabase.from("personas").select("*").eq("id", employeeId).maybeSingle(),
      supabase
        .from("empresas")
        .select("id, nombre, nif, sector, sitio_web, notas, logo_url, responsable_id, created_at, updated_at")
        .order("nombre"),
      supabase.from("personas").select("id, email"),
      supabase
        .from("oportunidades")
        .select("*")
        .eq("persona_id", employeeId)
        .order("creado_en", { ascending: false }),
    ]);

    if (employeeResult.error || !employeeResult.data) {
      setNotFound(true);
      setEmployee(null);
      setLoading(false);
      return;
    }

    const person = employeeResult.data;
    const employeeData: Employee = {
      id: person.id,
      nombre: person.nombre ?? "Sin nombre",
      email: person.email ?? null,
      empresa_id: person.empresa_id ?? null,
      cargo: person.cargo ?? null,
      telefono: person.telefono ?? null,
      notas: person.notas ?? null,
      es_interno: Boolean(person.es_interno),
      created_at: person.created_at,
      updated_at: person.updated_at,
    };

    const companyRow = (companiesResult.data ?? []).find((row) => row.id === person.empresa_id) ?? null;

    setNotFound(false);
    setEmployee(employeeData);
    setCompany(
      companyRow
        ? {
            id: companyRow.id,
            nombre: companyRow.nombre ?? "Sin nombre",
            nif: companyRow.nif ?? null,
            sector: companyRow.sector ?? null,
            sitio_web: companyRow.sitio_web ?? null,
            notas: companyRow.notas ?? null,
            logo_url: companyRow.logo_url ?? null,
            responsable_id: companyRow.responsable_id ?? null,
            created_at: companyRow.created_at,
            updated_at: companyRow.updated_at,
          }
        : null,
    );
    setCompanies((companiesResult.data ?? []).map((row) => ({ id: row.id, nombre: row.nombre ?? "Sin nombre" })));
    setExistingEmails(
      (emailsResult.data ?? [])
        .filter((row) => row.id !== employeeId && row.email)
        .map((row) => row.email as string),
    );
    setOpportunities(
      (opportunitiesResult.data ?? []).map((row) => ({
        id: row.id,
        nombre: employeeData.nombre,
        correo: employeeData.email ?? row.correo ?? "Sin correo",
        proyecto: row.proyecto ?? "Sin proyecto",
        detalles: row.detalles ?? "",
        precio: row.precio != null ? Number(row.precio) : null,
        estado: normalizeStage(row.estado),
        creado_en: row.creado_en,
      })),
    );
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSave = async (values: EmployeeFormValues) => {
    if (!employee) return;

    setSaving(true);
    const { error } = await supabase
      .from("personas")
      .update({
        nombre: values.nombre,
        email: values.email || null,
        empresa_id: values.empresa_id || null,
        cargo: values.cargo || null,
        telefono: values.telefono || null,
        notas: values.notas || null,
        es_interno: false,
      })
      .eq("id", employee.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido guardar el empleado. Inténtalo de nuevo." });
      return;
    }

    setEditorOpen(false);
    setNotice({ type: "success", text: `Cambios guardados en «${values.nombre}».` });
    load();
  };

  const handleDelete = async () => {
    if (!employee) return;

    setSaving(true);
    const { error } = await supabase.from("personas").delete().eq("id", employee.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido eliminar el empleado. Inténtalo de nuevo." });
      return;
    }

    router.push("/?vista=empleados");
  };

  if (loading) {
    return (
      <DashboardShell title="Empleado" subtitle="Cargando ficha">
        <div className="empty-column">Cargando...</div>
      </DashboardShell>
    );
  }

  if (notFound || !employee) {
    return (
      <DashboardShell title="Empleado" subtitle="No encontrado">
        <div className="empty-state">
          <p>No encontramos este empleado.</p>
          <Link href="/?vista=empleados" className="btn btn-primary">
            Volver a empleados
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={employee.nombre} subtitle="Ficha del empleado">
      <div className="entity-detail">
        <div className="entity-detail-toolbar">
          <Link href="/?vista=empleados" className="back-link">
            ← Volver a empleados
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

        <section className="entity-hero" aria-label="Datos del empleado">
          <EntityLogo name={employee.nombre} size="lg" />
          <div className="entity-hero-copy">
            <h2>{employee.nombre}</h2>
            {employee.cargo ? <span className="company-sector">{employee.cargo}</span> : null}
          </div>
        </section>

        <section className="detail-grid" aria-label="Información general">
          <article className="detail-card">
            <h3>Datos</h3>
            <dl className="detail-facts">
              <div>
                <dt>Empresa</dt>
                <dd>
                  {company ? <Link href={`/empresas/${company.id}`}>{company.nombre}</Link> : "—"}
                </dd>
              </div>
              <div>
                <dt>Cargo</dt>
                <dd>{employee.cargo || "—"}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>
                  {employee.email ? <span className="contact-email">{employee.email}</span> : "—"}
                </dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>
                  {employee.telefono ? (
                    <a href={`tel:${employee.telefono.replace(/\s/g, "")}`}>{employee.telefono}</a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </article>

          <article className="detail-card">
            <h3>Notas</h3>
            {employee.notas ? <p className="detail-notes">{employee.notas}</p> : <p className="is-empty">Sin notas</p>}
          </article>
        </section>

        <section className="detail-card" aria-label="Oportunidades del empleado">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Oportunidades</h3>
              <span>{opportunities.length}</span>
            </div>
          </div>

          {opportunities.length ? (
            <div className="related-opp-list">
              {opportunities.map((opp) => (
                <Link key={opp.id} href={`/oportunidades/${opp.id}`} className="related-opp-card">
                  <div className="related-opp-copy">
                    <strong>{opp.nombre}</strong>
                    <span>{opp.proyecto}</span>
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
            <div className="empty-column">Este empleado todavía no tiene oportunidades</div>
          )}
        </section>
      </div>

      {editorOpen && (
        <EmployeeEditor
          employee={employee}
          companies={companies}
          existingEmails={existingEmails}
          saving={saving}
          mode="contact"
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteEmployeeDialog
          employee={employee}
          opportunitiesCount={opportunities.length}
          deleting={saving}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </DashboardShell>
  );
}
