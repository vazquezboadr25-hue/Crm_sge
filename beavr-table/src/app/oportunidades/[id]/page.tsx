"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { EntityLogo } from "@/components/EntityLogo";
import {
  DeleteOpportunityDialog,
  OpportunityEditor,
  type OpportunityFormValues,
  type OpportunityRecord,
} from "@/components/OpportunityDialogs";
import { formatPrice, parsePriceInput } from "@/lib/crm/money";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER, normalizeStage, type Stage } from "@/lib/crm/stages";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const supabase = createSupabaseBrowserClient();

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const opportunityId = params.id;

  const [opportunity, setOpportunity] = useState<OpportunityRecord | null>(null);
  const [company, setCompany] = useState<{ id: string; nombre: string } | null>(null);
  const [employee, setEmployee] = useState<{ id: string; nombre: string; email: string | null } | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; nombre: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; nombre: string; empresa_id: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [oppResult, companiesResult, employeesResult] = await Promise.all([
      supabase.from("oportunidades").select("*").eq("id", opportunityId).maybeSingle(),
      supabase.from("empresas").select("id, nombre").order("nombre", { ascending: true }),
      supabase.from("personas").select("id, nombre, empresa_id").order("nombre", { ascending: true }),
    ]);

    if (oppResult.error || !oppResult.data) {
      setNotFound(true);
      setOpportunity(null);
      setLoading(false);
      return;
    }

    const data = oppResult.data;
    const detail: OpportunityRecord = {
      id: data.id,
      nombre: data.nombre ?? "Sin nombre",
      correo: data.correo ?? "Sin correo",
      proyecto: data.proyecto ?? "Sin proyecto",
      detalles: data.detalles ?? "",
      origen: data.origen ?? "—",
      estado: normalizeStage(data.estado),
      precio: data.precio != null ? Number(data.precio) : null,
      creado_en: data.creado_en,
      empresa_id: data.empresa_id ?? null,
      persona_id: data.persona_id ?? null,
    };

    const [companyResult, employeeResult] = await Promise.all([
      detail.empresa_id
        ? supabase.from("empresas").select("id, nombre").eq("id", detail.empresa_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      detail.persona_id
        ? supabase.from("personas").select("id, nombre, email").eq("id", detail.persona_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    setNotFound(false);
    setOpportunity(detail);
    setCompanies(
      (companiesResult.data ?? []).map((row) => ({
        id: row.id,
        nombre: row.nombre ?? "Sin nombre",
      })),
    );
    setEmployees(
      (employeesResult.data ?? []).map((row) => ({
        id: row.id,
        nombre: row.nombre ?? "Sin nombre",
        empresa_id: row.empresa_id ?? null,
      })),
    );
    setCompany(companyResult.data ? { id: companyResult.data.id, nombre: companyResult.data.nombre ?? "Sin nombre" } : null);
    setEmployee(
      employeeResult.data
        ? {
            id: employeeResult.data.id,
            nombre: employeeResult.data.nombre ?? "Sin nombre",
            email: employeeResult.data.email ?? null,
          }
        : null,
    );
    setLoading(false);
  }, [opportunityId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleStatusChange = async (nextStage: Stage) => {
    if (!opportunity) return;
    setSaving(true);
    const { error } = await supabase.from("oportunidades").update({ estado: nextStage }).eq("id", opportunity.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido cambiar el estado. Inténtalo de nuevo." });
      return;
    }

    setOpportunity({ ...opportunity, estado: nextStage });
    setNotice({ type: "success", text: `Estado cambiado a «${STAGE_LABELS[nextStage]}».` });
  };

  const handleSave = async (values: OpportunityFormValues) => {
    if (!opportunity) return;
    setSaving(true);

    const precio = parsePriceInput(values.precio);
    const payload = {
      nombre: values.nombre,
      correo: values.correo,
      proyecto: values.proyecto,
      detalles: values.detalles || null,
      precio: precio === null || Number.isNaN(precio) ? null : precio,
      empresa_id: values.empresa_id || null,
      persona_id: values.persona_id || null,
      estado: values.estado,
    };

    const { error } = await supabase.from("oportunidades").update(payload).eq("id", opportunity.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se han podido guardar los cambios. Inténtalo de nuevo." });
      return;
    }

    setEditorOpen(false);
    setNotice({ type: "success", text: "Oportunidad actualizada." });
    await load();
  };

  const handleDelete = async () => {
    if (!opportunity) return;
    setSaving(true);
    const { error } = await supabase.from("oportunidades").delete().eq("id", opportunity.id);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido eliminar la oportunidad. Inténtalo de nuevo." });
      setDeleteOpen(false);
      return;
    }

    router.push("/?vista=oportunidades");
  };

  if (loading) {
    return (
      <DashboardShell title="Oportunidad" subtitle="Cargando ficha">
        <div className="empty-column">Cargando...</div>
      </DashboardShell>
    );
  }

  if (notFound || !opportunity) {
    return (
      <DashboardShell title="Oportunidad" subtitle="No encontrada">
        <div className="empty-state">
          <p>No encontramos esta oportunidad.</p>
          <Link href="/?vista=oportunidades" className="btn btn-primary">
            Volver a oportunidades
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const priceLabel = formatPrice(opportunity.precio);

  return (
    <DashboardShell title={opportunity.nombre} subtitle={opportunity.proyecto}>
      <div className="entity-detail">
        <div className="entity-detail-toolbar">
          <Link href="/?vista=oportunidades" className="back-link">
            ← Volver a oportunidades
          </Link>
        </div>

        {notice && (
          <div className={`notice notice-${notice.type}`} role="status">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        <section className="entity-hero opportunity-hero" aria-label="Resumen de la oportunidad">
          <EntityLogo name={opportunity.nombre} size="lg" />
          <div className="entity-hero-copy">
            <div className="detail-label">Interesado</div>
            <h2>{opportunity.nombre}</h2>
            <p className="opportunity-hero-project">{opportunity.proyecto}</p>
            <span
              className="status-pill"
              style={{
                background: STAGE_COLORS[opportunity.estado].background,
                color: STAGE_COLORS[opportunity.estado].color,
              }}
            >
              {STAGE_LABELS[opportunity.estado]}
            </span>
          </div>
          <div className="opportunity-hero-actions">
            <button type="button" className="btn btn-soft" onClick={() => setEditorOpen(true)} disabled={saving}>
              Editar
            </button>
            <button type="button" className="btn btn-danger-soft" onClick={() => setDeleteOpen(true)} disabled={saving}>
              Eliminar
            </button>
          </div>
        </section>

        <article className="detail-card opportunity-description-card" aria-label="Descripción y precio">
          <h3>Descripción</h3>
          {opportunity.detalles ? (
            <p className="detail-notes">{opportunity.detalles}</p>
          ) : (
            <p className="is-empty">Sin descripción</p>
          )}
          <div className="opportunity-price-block">
            <span className="opportunity-price-label">Precio</span>
            <strong className="opportunity-price">{priceLabel ?? "Sin precio"}</strong>
          </div>
        </article>

        <section className="detail-grid" aria-label="Información de la oportunidad">
          <article className="detail-card">
            <h3>Datos</h3>
            <dl className="detail-facts">
              <div>
                <dt>Correo</dt>
                <dd>
                  <a href={`mailto:${opportunity.correo}`}>{opportunity.correo}</a>
                </dd>
              </div>
              <div>
                <dt>Empresa</dt>
                <dd>{company ? <Link href={`/empresas/${company.id}`}>{company.nombre}</Link> : "—"}</dd>
              </div>
              <div>
                <dt>Empleado</dt>
                <dd>{employee ? <Link href={`/empleados/${employee.id}`}>{employee.nombre}</Link> : "—"}</dd>
              </div>
              <div>
                <dt>Origen</dt>
                <dd>{opportunity.origen}</dd>
              </div>
              <div>
                <dt>Creada</dt>
                <dd>{formatDate(opportunity.creado_en)}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-card" aria-label="Cambiar estado">
            <h3>Estado de la negociación</h3>
            <div className="detail-status-list" style={{ marginTop: 12 }}>
              {STAGE_ORDER.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={`detail-status-btn ${opportunity.estado === stage ? "active" : ""}`}
                  style={
                    opportunity.estado === stage
                      ? {
                          background: STAGE_COLORS[stage].bar,
                          borderColor: STAGE_COLORS[stage].bar,
                          color: "#fff",
                        }
                      : undefined
                  }
                  onClick={() => handleStatusChange(stage)}
                  disabled={saving}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>

      {editorOpen && (
        <OpportunityEditor
          opportunity={opportunity}
          companies={companies}
          employees={employees}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteOpportunityDialog
          opportunity={opportunity}
          deleting={saving}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </DashboardShell>
  );
}
