"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/FormField";
import { CloseButton, Modal, formatDate } from "@/components/Modal";
import type { Admision, EstadoLaboral, StaffMember } from "@/lib/crm/rrhh";
import { ESTADO_LABORAL_LABELS } from "@/lib/crm/rrhh";

export type StaffFormValues = {
  nombre: string;
  email: string;
  cargo: string;
  telefono: string;
  notas: string;
  estado_laboral: EstadoLaboral;
  fecha_alta: string;
  fotoFile: File | null;
};

export type AdmisionFormValues = {
  nombre: string;
  email: string;
  telefono: string;
  puesto: string;
  notas: string;
  cvFile: File | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]{6,}$/;

export function StaffEditor({
  staff,
  existingEmails,
  saving,
  onSave,
  onClose,
}: {
  staff: StaffMember | null;
  existingEmails: string[];
  saving: boolean;
  onSave: (values: StaffFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<StaffFormValues>({
    nombre: staff?.nombre ?? "",
    email: staff?.email ?? "",
    cargo: staff?.cargo ?? "",
    telefono: staff?.telefono ?? "",
    notas: staff?.notas ?? "",
    estado_laboral: staff?.estado_laboral ?? "activo",
    fecha_alta: staff?.fecha_alta ?? new Date().toISOString().slice(0, 10),
    fotoFile: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormValues, string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const isNew = staff === null;

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const update = <K extends keyof StaffFormValues>(field: K, value: StaffFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nombre = values.nombre.trim();
    const email = values.email.trim().toLowerCase();
    const telefono = values.telefono.trim();
    const nextErrors: typeof errors = {};

    if (!nombre) nextErrors.nombre = "Escribe el nombre del trabajador.";
    if (email) {
      if (!emailPattern.test(email)) {
        nextErrors.email = "Escribe un correo válido.";
      } else if (existingEmails.some((item) => item.trim().toLowerCase() === email)) {
        nextErrors.email = "Ya hay otra persona con este correo.";
      }
    }
    if (telefono && !phonePattern.test(telefono)) {
      nextErrors.telefono = "Escribe un teléfono válido.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      ...values,
      nombre,
      email,
      telefono,
      cargo: values.cargo.trim(),
      notas: values.notas.trim(),
    });
  };

  return (
    <Modal titleId="staff-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">{isNew ? "Nueva ficha" : "Editar ficha"}</div>
          <h3 id="staff-editor-title">{isNew ? "Añadir trabajador" : staff.nombre}</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <FormField id="staff-nombre" label="Nombre" required error={errors.nombre}>
          <input
            ref={nameRef}
            id="staff-nombre"
            type="text"
            value={values.nombre}
            onChange={(event) => update("nombre", event.target.value)}
            placeholder="Ej.: Ana García"
            aria-required="true"
            className={errors.nombre ? "is-invalid" : ""}
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "staff-nombre-error" : undefined}
          />
        </FormField>

        <div className="form-row">
          <FormField id="staff-cargo" label="Puesto">
            <input
              id="staff-cargo"
              type="text"
              value={values.cargo}
              onChange={(event) => update("cargo", event.target.value)}
              placeholder="Ej.: Desarrollador"
            />
          </FormField>
          <FormField id="staff-estado" label="Estado">
            <select
              id="staff-estado"
              value={values.estado_laboral}
              onChange={(event) => update("estado_laboral", event.target.value as EstadoLaboral)}
            >
              <option value="activo">{ESTADO_LABORAL_LABELS.activo}</option>
              <option value="baja">{ESTADO_LABORAL_LABELS.baja}</option>
            </select>
          </FormField>
        </div>

        <div className="form-row">
          <FormField id="staff-email" label="Email" error={errors.email}>
            <input
              id="staff-email"
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="Ej.: ana@beavr.com"
              className={errors.email ? "is-invalid" : ""}
              aria-describedby={errors.email ? "staff-email-error" : undefined}
            />
          </FormField>
          <FormField id="staff-telefono" label="Teléfono" error={errors.telefono}>
            <input
              id="staff-telefono"
              type="tel"
              value={values.telefono}
              onChange={(event) => update("telefono", event.target.value)}
              placeholder="Ej.: 600 123 456"
              className={errors.telefono ? "is-invalid" : ""}
              aria-describedby={errors.telefono ? "staff-telefono-error" : undefined}
            />
          </FormField>
        </div>

        <div className="form-row">
          <FormField id="staff-alta" label="Fecha de alta">
            <input
              id="staff-alta"
              type="date"
              value={values.fecha_alta}
              onChange={(event) => update("fecha_alta", event.target.value)}
            />
          </FormField>
          <FormField
            id="staff-foto"
            label="Foto"
            help={
              staff?.foto_url && !values.fotoFile
                ? "Ya hay una foto subida. Elige otra para sustituirla."
                : "PNG, JPG o WEBP."
            }
          >
            <input
              id="staff-foto"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => update("fotoFile", event.target.files?.[0] ?? null)}
              aria-describedby="staff-foto-help"
            />
          </FormField>
        </div>

        <FormField id="staff-notas" label="Notas">
          <textarea
            id="staff-notas"
            rows={3}
            value={values.notas}
            onChange={(event) => update("notas", event.target.value)}
          />
        </FormField>

        {!isNew ? (
          <dl className="form-dates">
            <div>
              <dt>Creado</dt>
              <dd>{formatDate(staff.created_at)}</dd>
            </div>
            <div>
              <dt>Última modificación</dt>
              <dd>{formatDate(staff.updated_at)}</dd>
            </div>
          </dl>
        ) : null}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : isNew ? "Crear ficha" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AdmisionEditor({
  saving,
  onSave,
  onClose,
}: {
  saving: boolean;
  onSave: (values: AdmisionFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<AdmisionFormValues>({
    nombre: "",
    email: "",
    telefono: "",
    puesto: "",
    notas: "",
    cvFile: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdmisionFormValues, string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const update = <K extends keyof AdmisionFormValues>(field: K, value: AdmisionFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nombre = values.nombre.trim();
    const email = values.email.trim().toLowerCase();
    const nextErrors: typeof errors = {};
    if (!nombre) nextErrors.nombre = "Escribe el nombre del candidato.";
    if (email && !emailPattern.test(email)) nextErrors.email = "Escribe un correo válido.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      ...values,
      nombre,
      email,
      telefono: values.telefono.trim(),
      puesto: values.puesto.trim(),
      notas: values.notas.trim(),
    });
  };

  return (
    <Modal titleId="admision-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Admisión</div>
          <h3 id="admision-editor-title">Nuevo proceso de admisión</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <FormField id="admision-nombre" label="Nombre" required error={errors.nombre}>
          <input
            ref={nameRef}
            id="admision-nombre"
            type="text"
            value={values.nombre}
            onChange={(event) => update("nombre", event.target.value)}
            placeholder="Ej.: Ana García"
            aria-required="true"
            className={errors.nombre ? "is-invalid" : ""}
            aria-describedby={errors.nombre ? "admision-nombre-error" : undefined}
          />
        </FormField>

        <div className="form-row">
          <FormField id="admision-puesto" label="Puesto solicitado">
            <input
              id="admision-puesto"
              type="text"
              value={values.puesto}
              onChange={(event) => update("puesto", event.target.value)}
              placeholder="Ej.: Desarrollador"
            />
          </FormField>
          <FormField id="admision-email" label="Email" error={errors.email}>
            <input
              id="admision-email"
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="Ej.: ana@email.com"
              className={errors.email ? "is-invalid" : ""}
              aria-describedby={errors.email ? "admision-email-error" : undefined}
            />
          </FormField>
        </div>

        <div className="form-row">
          <FormField id="admision-telefono" label="Teléfono">
            <input
              id="admision-telefono"
              type="tel"
              value={values.telefono}
              onChange={(event) => update("telefono", event.target.value)}
              placeholder="Ej.: 600 123 456"
            />
          </FormField>
          <FormField id="admision-cv" label="CV" help="PDF o imagen.">
            <input
              id="admision-cv"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(event) => update("cvFile", event.target.files?.[0] ?? null)}
              aria-describedby="admision-cv-help"
            />
          </FormField>
        </div>

        <FormField id="admision-notas" label="Notas">
          <textarea
            id="admision-notas"
            rows={3}
            value={values.notas}
            onChange={(event) => update("notas", event.target.value)}
          />
        </FormField>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Crear admisión"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function HireAdmisionDialog({
  admision,
  hiring,
  onConfirm,
  onClose,
}: {
  admision: Admision;
  hiring: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal titleId="hire-admision-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Contratar</div>
          <h3 id="hire-admision-title">¿Contratar a «{admision.nombre}»?</h3>
        </div>
        <CloseButton label="Cancelar" onClick={onClose} />
      </div>
      <p className="modal-text">
        Se creará la ficha del trabajador con el correo indicado, se marcará la admisión como contratada y se
        generará el checklist de inicio (portátil, correo, accesos…).
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={hiring}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={hiring}>
          {hiring ? "Contratando..." : "Sí, contratar"}
        </button>
      </div>
    </Modal>
  );
}

export function VacacionDialog({
  saving,
  onSave,
  onClose,
}: {
  saving: boolean;
  onSave: (values: { fecha_inicio: string; fecha_fin: string; motivo: string }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInicioChange = (value: string) => {
    setFechaInicio(value);
    setError(null);
    setFechaFin((current) => (current < value ? value : current));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError("Indica las fechas.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior al inicio.");
      return;
    }
    onSave({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, motivo: motivo.trim() });
  };

  return (
    <Modal titleId="vacacion-dialog-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Vacaciones</div>
          <h3 id="vacacion-dialog-title">Solicitar vacaciones</h3>
        </div>
        <CloseButton label="Cerrar" onClick={onClose} />
      </div>
      <form className="company-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <FormField id="vac-inicio" label="Desde" required>
            <input
              id="vac-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => handleInicioChange(e.target.value)}
              aria-required="true"
            />
          </FormField>
          <FormField id="vac-fin" label="Hasta" required>
            <input
              id="vac-fin"
              type="date"
              min={fechaInicio}
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setError(null);
              }}
              aria-required="true"
            />
          </FormField>
        </div>
        <FormField id="vac-motivo" label="Motivo" help="Opcional.">
          <textarea id="vac-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enviando..." : "Solicitar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EvaluacionDialog({
  defaultPeriodo,
  saving,
  onSave,
  onClose,
}: {
  defaultPeriodo: string;
  saving: boolean;
  onSave: (values: { periodo: string; nota: number; comentario: string }) => void;
  onClose: () => void;
}) {
  const [periodo, setPeriodo] = useState(defaultPeriodo);
  const [nota, setNota] = useState(3);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!periodo.trim()) {
      setError("Indica el periodo (p. ej. T1 2026).");
      return;
    }
    onSave({ periodo: periodo.trim(), nota, comentario: comentario.trim() });
  };

  return (
    <Modal titleId="eval-dialog-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Evaluación</div>
          <h3 id="eval-dialog-title">Nueva evaluación trimestral</h3>
        </div>
        <CloseButton label="Cerrar" onClick={onClose} />
      </div>
      <form className="company-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <FormField
            id="eval-periodo"
            label="Periodo"
            required
            error={error}
            help={error ? undefined : "Ejemplo: T1 2026."}
          >
            <input
              id="eval-periodo"
              type="text"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                setError(null);
              }}
              placeholder="Ej.: T1 2026"
              aria-required="true"
              aria-describedby={error ? "eval-periodo-error" : "eval-periodo-help"}
            />
          </FormField>
          <FormField id="eval-nota" label="Nota" help="De 1 a 5.">
            <select id="eval-nota" value={nota} onChange={(e) => setNota(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField id="eval-comentario" label="Comentario">
          <textarea
            id="eval-comentario"
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </FormField>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar evaluación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function NominaUploadDialog({
  saving,
  onSave,
  onClose,
}: {
  saving: boolean;
  onSave: (values: { periodo: string; file: File }) => void;
  onClose: () => void;
}) {
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!periodo.trim()) {
      setError("Indica el periodo de la nómina.");
      return;
    }
    if (!file) {
      setError("Sube el PDF de la nómina.");
      return;
    }
    onSave({ periodo: periodo.trim(), file });
  };

  return (
    <Modal titleId="nomina-dialog-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Nómina</div>
          <h3 id="nomina-dialog-title">Subir nómina PDF</h3>
        </div>
        <CloseButton label="Cerrar" onClick={onClose} />
      </div>
      <form className="company-form" onSubmit={handleSubmit}>
        <FormField
          id="nomina-periodo"
          label="Periodo"
          required
          help="Formato mes/año."
        >
          <input
            id="nomina-periodo"
            type="text"
            value={periodo}
            onChange={(e) => {
              setPeriodo(e.target.value);
              setError(null);
            }}
            placeholder="Ej.: 10/2026"
            aria-required="true"
            aria-describedby="nomina-periodo-help"
          />
        </FormField>
        <FormField id="nomina-file" label="Archivo PDF" required help="Solo PDF.">
          <input
            id="nomina-file"
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
            aria-required="true"
            aria-describedby="nomina-file-help"
          />
        </FormField>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Subiendo..." : "Subir nómina"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
