"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DashboardShell } from "@/components/DashboardShell";
import { EntityLogo } from "@/components/EntityLogo";
import {
  EvaluacionDialog,
  NominaUploadDialog,
  StaffEditor,
  VacacionDialog,
  type StaffFormValues,
} from "@/components/rrhh/HrDialogs";
import {
  ESTADO_LABORAL_LABELS,
  VACACION_LABELS,
  currentQuarterLabel,
  formatDateEs,
  formatDateTimeEs,
  mapStaffRow,
  type Evaluacion,
  type Fichaje,
  type Nomina,
  type OnboardingItem,
  type StaffMember,
  type Vacacion,
  type VacacionEstado,
} from "@/lib/crm/rrhh";
import {
  uploadNominaPdf,
  uploadStaffPhoto,
  validatePdfFile,
  validatePhotoFile,
} from "@/lib/crm/rrhhStorage";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const supabase = createSupabaseBrowserClient();

export default function RrhhDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const staffId = params.id;

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingItem[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [vacacionOpen, setVacacionOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [nominaOpen, setNominaOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
  };

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);

    const [
      personResult,
      emailsResult,
      fichajesResult,
      vacacionesResult,
      onboardingResult,
      evaluacionesResult,
      nominasResult,
    ] = await Promise.all([
      supabase.from("personas").select("*").eq("id", staffId).eq("es_interno", true).maybeSingle(),
      supabase.from("personas").select("id, email"),
      supabase.from("rrhh_fichajes").select("*").eq("persona_id", staffId).order("entrada_en", { ascending: false }),
      supabase.from("rrhh_vacaciones").select("*").eq("persona_id", staffId).order("fecha_inicio", { ascending: false }),
      supabase.from("rrhh_onboarding").select("*").eq("persona_id", staffId).order("orden", { ascending: true }),
      supabase.from("rrhh_evaluaciones").select("*").eq("persona_id", staffId).order("created_at", { ascending: false }),
      supabase.from("rrhh_nominas").select("*").eq("persona_id", staffId).order("created_at", { ascending: false }),
    ]);

    if (personResult.error || !personResult.data) {
      setNotFound(true);
      setStaff(null);
      if (!silent) setLoading(false);
      return;
    }

    setNotFound(false);
    setStaff(mapStaffRow(personResult.data as Record<string, unknown>));
    setExistingEmails(
      (emailsResult.data ?? [])
        .filter((row) => row.id !== staffId && row.email)
        .map((row) => row.email as string),
    );
    setFichajes((fichajesResult.data ?? []) as Fichaje[]);
    setVacaciones((vacacionesResult.data ?? []) as Vacacion[]);
    setOnboarding((onboardingResult.data ?? []) as OnboardingItem[]);
    setEvaluaciones((evaluacionesResult.data ?? []) as Evaluacion[]);
    setNominas((nominasResult.data ?? []) as Nomina[]);
    if (!silent) setLoading(false);
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const openFichaje = fichajes.find((item) => !item.salida_en) ?? null;

  const handleSaveStaff = async (values: StaffFormValues) => {
    if (!staff) return;
    setSaving(true);

    let fotoUrl = staff.foto_url;
    if (values.fotoFile) {
      const photoError = validatePhotoFile(values.fotoFile);
      if (photoError) {
        setSaving(false);
        showNotice("error", photoError);
        return;
      }
      try {
        fotoUrl = await uploadStaffPhoto(supabase, staff.id, values.fotoFile);
      } catch {
        setSaving(false);
        showNotice("error", "No se ha podido subir la foto.");
        return;
      }
    }

    const { data, error } = await supabase
      .from("personas")
      .update({
        nombre: values.nombre,
        email: values.email || null,
        cargo: values.cargo || null,
        telefono: values.telefono || null,
        notas: values.notas || null,
        estado_laboral: values.estado_laboral,
        fecha_alta: values.fecha_alta || null,
        foto_url: fotoUrl,
        es_interno: true,
        empresa_id: null,
      })
      .eq("id", staff.id)
      .select("*")
      .single();

    setSaving(false);
    if (error) {
      showNotice("error", "No se han podido guardar los cambios.");
      return;
    }

    if (data) {
      setStaff(mapStaffRow(data as Record<string, unknown>));
    } else {
      setStaff({
        ...staff,
        nombre: values.nombre,
        email: values.email || null,
        cargo: values.cargo || null,
        telefono: values.telefono || null,
        notas: values.notas || null,
        estado_laboral: values.estado_laboral,
        fecha_alta: values.fecha_alta || null,
        foto_url: fotoUrl,
      });
    }
    setEditorOpen(false);
    showNotice("success", "Ficha actualizada.");
  };

  const handleClock = async () => {
    if (!staff) return;
    setSaving(true);

    if (openFichaje) {
      const salidaEn = new Date().toISOString();
      const { error } = await supabase
        .from("rrhh_fichajes")
        .update({ salida_en: salidaEn })
        .eq("id", openFichaje.id);
      setSaving(false);
      if (error) {
        showNotice("error", "No se ha podido fichar la salida.");
        return;
      }
      setFichajes((list) =>
        list.map((item) => (item.id === openFichaje.id ? { ...item, salida_en: salidaEn } : item)),
      );
      showNotice("success", "Salida registrada.");
    } else {
      const entradaEn = new Date().toISOString();
      const { data, error } = await supabase
        .from("rrhh_fichajes")
        .insert({
          persona_id: staff.id,
          entrada_en: entradaEn,
        })
        .select("*")
        .single();
      setSaving(false);
      if (error) {
        showNotice("error", "No se ha podido fichar la entrada.");
        return;
      }
      if (data) {
        setFichajes((list) => [data as Fichaje, ...list]);
      } else {
        void load({ silent: true });
      }
      showNotice("success", "Entrada registrada.");
    }
  };

  const handleVacacion = async (values: { fecha_inicio: string; fecha_fin: string; motivo: string }) => {
    if (!staff) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("rrhh_vacaciones")
      .insert({
        persona_id: staff.id,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        motivo: values.motivo || null,
        estado: "pendiente",
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      showNotice("error", "No se ha podido solicitar las vacaciones.");
      return;
    }
    if (data) {
      setVacaciones((list) => [data as Vacacion, ...list]);
    } else {
      void load({ silent: true });
    }
    setVacacionOpen(false);
    showNotice("success", "Solicitud de vacaciones enviada.");
  };

  const updateVacacionEstado = async (id: string, estado: VacacionEstado) => {
    const previous = vacaciones.find((item) => item.id === id);
    setVacaciones((list) => list.map((item) => (item.id === id ? { ...item, estado } : item)));
    const { error } = await supabase.from("rrhh_vacaciones").update({ estado }).eq("id", id);
    if (error) {
      if (previous) {
        setVacaciones((list) => list.map((item) => (item.id === id ? previous : item)));
      }
      showNotice("error", "No se ha podido actualizar la solicitud.");
      return;
    }
    showNotice("success", `Solicitud marcada como ${VACACION_LABELS[estado].toLowerCase()}.`);
  };

  const toggleOnboarding = async (item: OnboardingItem) => {
    const next = !item.completado;
    const completadoEn = next ? new Date().toISOString() : null;
    setOnboarding((list) =>
      list.map((row) =>
        row.id === item.id ? { ...row, completado: next, completado_en: completadoEn } : row,
      ),
    );
    const { error } = await supabase
      .from("rrhh_onboarding")
      .update({
        completado: next,
        completado_en: completadoEn,
      })
      .eq("id", item.id);
    if (error) {
      setOnboarding((list) =>
        list.map((row) =>
          row.id === item.id
            ? { ...row, completado: item.completado, completado_en: item.completado_en }
            : row,
        ),
      );
      showNotice("error", "No se ha podido actualizar el checklist.");
    }
  };

  const handleEvaluacion = async (values: { periodo: string; nota: number; comentario: string }) => {
    if (!staff) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("rrhh_evaluaciones")
      .insert({
        persona_id: staff.id,
        periodo: values.periodo,
        nota: values.nota,
        comentario: values.comentario || null,
        evaluador: user?.email ?? null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      showNotice("error", "No se ha podido guardar la evaluación.");
      return;
    }
    if (data) {
      setEvaluaciones((list) => [data as Evaluacion, ...list]);
    } else {
      void load({ silent: true });
    }
    setEvalOpen(false);
    showNotice("success", "Evaluación guardada.");
  };

  const handleNomina = async (values: { periodo: string; file: File }) => {
    if (!staff) return;
    const fileError = validatePdfFile(values.file);
    if (fileError) {
      showNotice("error", fileError);
      return;
    }
    setSaving(true);
    try {
      const archivoUrl = await uploadNominaPdf(supabase, staff.id, values.file);
      const { data, error } = await supabase
        .from("rrhh_nominas")
        .insert({
          persona_id: staff.id,
          periodo: values.periodo,
          archivo_url: archivoUrl,
          archivo_nombre: values.file.name,
          firmado: false,
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data) {
        setNominas((list) => [data as Nomina, ...list]);
      } else {
        void load({ silent: true });
      }
      setNominaOpen(false);
      showNotice("success", "Nómina subida.");
    } catch {
      showNotice("error", "No se ha podido subir la nómina.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignNomina = async (nomina: Nomina) => {
    const firmadoEn = new Date().toISOString();
    const firmadoPor = user?.email ?? "usuario";
    setNominas((list) =>
      list.map((item) =>
        item.id === nomina.id
          ? { ...item, firmado: true, firmado_en: firmadoEn, firmado_por: firmadoPor }
          : item,
      ),
    );
    const { error } = await supabase
      .from("rrhh_nominas")
      .update({
        firmado: true,
        firmado_en: firmadoEn,
        firmado_por: firmadoPor,
      })
      .eq("id", nomina.id);
    if (error) {
      setNominas((list) => list.map((item) => (item.id === nomina.id ? nomina : item)));
      showNotice("error", "No se ha podido firmar la nómina.");
      return;
    }
    showNotice("success", "Nómina firmada.");
  };

  const handleDelete = async () => {
    if (!staff) return;
    if (!window.confirm(`¿Eliminar la ficha de «${staff.nombre}»? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("personas").delete().eq("id", staff.id);
    setSaving(false);
    if (error) {
      showNotice("error", "No se ha podido eliminar la ficha.");
      return;
    }
    router.push("/?vista=rrhh");
  };

  if (loading) {
    return (
      <DashboardShell title="Plantilla" subtitle="Cargando ficha">
        <div className="empty-column">Cargando…</div>
      </DashboardShell>
    );
  }

  if (notFound || !staff) {
    return (
      <DashboardShell title="Plantilla" subtitle="No encontrado">
        <div className="empty-state">
          <strong>No encontramos este trabajador</strong>
          <p>Puede haberse eliminado o el enlace no es válido.</p>
          <Link href="/?vista=rrhh" className="btn btn-primary">
            Volver a plantilla
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const onboardingDone = onboarding.filter((item) => item.completado).length;

  return (
    <DashboardShell title={staff.nombre} subtitle="Ficha RRHH · equipo interno">
      <div className="entity-detail">
        <Breadcrumbs
          items={[
            { label: "RRHH", href: "/?vista=rrhh" },
            { label: "Plantilla", href: "/?vista=rrhh" },
            { label: staff.nombre },
          ]}
        />
        <div className="entity-detail-toolbar">
          <Link href="/?vista=rrhh" className="back-link">
            ← Volver a plantilla
          </Link>
          <div className="entity-detail-actions">
            <button type="button" className="btn btn-soft" onClick={() => setEditorOpen(true)}>
              Editar ficha
            </button>
            <button type="button" className="btn btn-danger-soft" onClick={handleDelete} disabled={saving}>
              Eliminar ficha
            </button>
          </div>
        </div>

        {notice ? (
          <div className={`notice notice-${notice.type}`} role="status">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        ) : null}

        <section className="entity-hero" aria-label="Datos del trabajador">
          <EntityLogo name={staff.nombre} logoUrl={staff.foto_url} size="lg" />
          <div className="entity-hero-copy">
            <h2>{staff.nombre}</h2>
            {staff.cargo ? <span className="company-sector">{staff.cargo}</span> : null}
            <div className="rrhh-hero-meta">
              <span className={`rrhh-status rrhh-status-${staff.estado_laboral}`}>
                {ESTADO_LABORAL_LABELS[staff.estado_laboral]}
              </span>
              <span className="crm-table-muted">Alta: {formatDateEs(staff.fecha_alta)}</span>
            </div>
          </div>
        </section>

        <section className="detail-grid" aria-label="Información general">
          <article className="detail-card">
            <h3>Datos</h3>
            <dl className="detail-facts">
              <div>
                <dt>Puesto</dt>
                <dd>{staff.cargo || "—"}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{staff.email ? <span className="contact-email">{staff.email}</span> : "—"}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>
                  {staff.telefono ? (
                    <a href={`tel:${staff.telefono.replace(/\s/g, "")}`}>{staff.telefono}</a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Estado laboral</dt>
                <dd>{ESTADO_LABORAL_LABELS[staff.estado_laboral]}</dd>
              </div>
            </dl>
          </article>
          <article className="detail-card">
            <h3>Notas</h3>
            {staff.notas ? <p className="detail-notes">{staff.notas}</p> : <p className="is-empty">Sin notas</p>}
          </article>
        </section>

        <section className="detail-card" aria-label="Horarios">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Horarios</h3>
              <span>{fichajes.length}</span>
            </div>
            <div className="rrhh-row-actions">
              <button type="button" className="btn btn-primary" onClick={handleClock} disabled={saving}>
                {openFichaje ? "Fichar salida" : "Fichar entrada"}
              </button>
              <button type="button" className="btn btn-soft" onClick={() => setVacacionOpen(true)}>
                Solicitar vacaciones
              </button>
            </div>
          </div>

          {openFichaje ? (
            <p className="rrhh-inline-hint">
              Jornada abierta desde {formatDateTimeEs(openFichaje.entrada_en)}.
            </p>
          ) : null}

          <div className="crm-table-wrap rrhh-nested-table">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Entrada</th>
                  <th>Salida</th>
                </tr>
              </thead>
              <tbody>
                {fichajes.length ? (
                  fichajes.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateTimeEs(item.entrada_en)}</td>
                      <td className="crm-table-muted">{item.salida_en ? formatDateTimeEs(item.salida_en) : "En curso"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="crm-table-empty">
                      Todavía no hay fichajes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h4 className="rrhh-subheading">Vacaciones</h4>
          <div className="crm-table-wrap rrhh-nested-table">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vacaciones.length ? (
                  vacaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateEs(item.fecha_inicio)}</td>
                      <td>{formatDateEs(item.fecha_fin)}</td>
                      <td>
                        <span className={`rrhh-status rrhh-status-${item.estado}`}>
                          {VACACION_LABELS[item.estado]}
                        </span>
                      </td>
                      <td>
                        {item.estado === "pendiente" ? (
                          <div className="rrhh-row-actions">
                            <button
                              type="button"
                              className="btn btn-soft"
                              onClick={() => updateVacacionEstado(item.id, "aprobada")}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-soft"
                              onClick={() => updateVacacionEstado(item.id, "rechazada")}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="crm-table-muted">{item.motivo || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="crm-table-empty">
                      Sin solicitudes de vacaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="detail-card" aria-label="Check de inicio">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Check de inicio</h3>
              <span>
                {onboardingDone}/{onboarding.length}
              </span>
            </div>
          </div>
          {onboarding.length ? (
            <ul className="rrhh-checklist">
              {onboarding.map((item) => (
                <li key={item.id}>
                  <label className="rrhh-check-item">
                    <input
                      type="checkbox"
                      checked={item.completado}
                      onChange={() => toggleOnboarding(item)}
                    />
                    <span className={item.completado ? "is-done" : undefined}>{item.titulo}</span>
                    {item.completado_en ? (
                      <em className="crm-table-muted">{formatDateTimeEs(item.completado_en)}</em>
                    ) : null}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-column">Sin checklist de onboarding</div>
          )}
        </section>

        <section className="detail-card" aria-label="Evaluaciones">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Evaluaciones</h3>
              <span>{evaluaciones.length}</span>
            </div>
            <button type="button" className="btn btn-soft" onClick={() => setEvalOpen(true)}>
              + Nueva evaluación
            </button>
          </div>
          {evaluaciones.length ? (
            <div className="related-opp-list">
              {evaluaciones.map((item) => (
                <div key={item.id} className="related-opp-card rrhh-eval-card">
                  <div className="related-opp-copy">
                    <strong>
                      {item.periodo} · nota {item.nota}/5
                    </strong>
                    <span>{item.comentario || "Sin comentario"}</span>
                    <span className="related-opp-price">
                      {formatDateEs(item.created_at)}
                      {item.evaluador ? ` · ${item.evaluador}` : ""}
                    </span>
                  </div>
                  <span className="status-pill rrhh-nota-pill">{item.nota}/5</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-column">Todavía no hay evaluaciones trimestrales</div>
          )}
        </section>

        <section className="detail-card" aria-label="Nóminas">
          <div className="directory-header">
            <div className="directory-title">
              <h3>Archivos · Nóminas</h3>
              <span>{nominas.length}</span>
            </div>
            <button type="button" className="btn btn-soft" onClick={() => setNominaOpen(true)}>
              + Subir nómina
            </button>
          </div>
          <div className="crm-table-wrap rrhh-nested-table">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Archivo</th>
                  <th>Firma</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nominas.length ? (
                  nominas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.periodo}</td>
                      <td>
                        <a href={item.archivo_url} target="_blank" rel="noreferrer">
                          {item.archivo_nombre || "Ver PDF"}
                        </a>
                      </td>
                      <td className="crm-table-muted">
                        {item.firmado
                          ? `Firmada ${formatDateTimeEs(item.firmado_en)}${item.firmado_por ? ` · ${item.firmado_por}` : ""}`
                          : "Pendiente de firma"}
                      </td>
                      <td>
                        {!item.firmado ? (
                          <button type="button" className="btn btn-soft" onClick={() => handleSignNomina(item)}>
                            Firmar
                          </button>
                        ) : (
                          <span className="rrhh-status rrhh-status-aprobada">Firmada</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="crm-table-empty">
                      Todavía no hay nóminas subidas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editorOpen ? (
        <StaffEditor
          staff={staff}
          existingEmails={existingEmails}
          saving={saving}
          onSave={handleSaveStaff}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}

      {vacacionOpen ? (
        <VacacionDialog saving={saving} onSave={handleVacacion} onClose={() => setVacacionOpen(false)} />
      ) : null}

      {evalOpen ? (
        <EvaluacionDialog
          defaultPeriodo={currentQuarterLabel()}
          saving={saving}
          onSave={handleEvaluacion}
          onClose={() => setEvalOpen(false)}
        />
      ) : null}

      {nominaOpen ? (
        <NominaUploadDialog saving={saving} onSave={handleNomina} onClose={() => setNominaOpen(false)} />
      ) : null}
    </DashboardShell>
  );
}
