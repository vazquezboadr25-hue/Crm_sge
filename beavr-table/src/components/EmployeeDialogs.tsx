"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/FormField";
import { CloseButton, Modal, formatDate } from "@/components/Modal";

export type Employee = {
  id: string;
  nombre: string;
  email: string | null;
  empresa_id: string | null;
  cargo: string | null;
  telefono: string | null;
  notas: string | null;
  es_interno: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeFormValues = {
  nombre: string;
  email: string;
  empresa_id: string;
  cargo: string;
  telefono: string;
  notas: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]{6,}$/;

export function EmployeeEditor({
  employee,
  companies = [],
  existingEmails,
  saving,
  mode = "internal",
  lockedCompanyId,
  onSave,
  onClose,
}: {
  employee: Employee | null;
  companies?: Array<{ id: string; nombre: string }>;
  existingEmails: string[];
  saving: boolean;
  mode?: "internal" | "contact";
  lockedCompanyId?: string | null;
  onSave: (values: EmployeeFormValues) => void;
  onClose: () => void;
}) {
  const isInternal = mode === "internal";
  const [values, setValues] = useState<EmployeeFormValues>({
    nombre: employee?.nombre ?? "",
    email: employee?.email ?? "",
    empresa_id: lockedCompanyId ?? employee?.empresa_id ?? "",
    cargo: employee?.cargo ?? "",
    telefono: employee?.telefono ?? "",
    notas: employee?.notas ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormValues, string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const isNew = employee === null;
  const titleNoun = isInternal ? "trabajador" : "contacto";

  const update = (field: keyof EmployeeFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nombre = values.nombre.trim();
    const email = values.email.trim().toLowerCase();
    const telefono = values.telefono.trim();
    const nextErrors: typeof errors = {};

    if (!nombre) {
      nextErrors.nombre = `Escribe el nombre del ${titleNoun}.`;
    }

    if (email) {
      if (!emailPattern.test(email)) {
        nextErrors.email = "Escribe un correo válido, por ejemplo: nombre@empresa.com";
      } else if (existingEmails.some((existing) => existing.trim().toLowerCase() === email)) {
        nextErrors.email = "Ya hay otra persona con este correo.";
      }
    }

    if (telefono && !phonePattern.test(telefono)) {
      nextErrors.telefono = "Escribe un teléfono válido, solo con números.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      nombre,
      email,
      empresa_id: isInternal ? "" : lockedCompanyId || values.empresa_id,
      cargo: values.cargo.trim(),
      telefono,
      notas: values.notas.trim(),
    });
  };

  return (
    <Modal titleId="employee-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">{isNew ? `Nuevo ${titleNoun}` : `Editar ${titleNoun}`}</div>
          <h3 id="employee-editor-title">{isNew ? `Añadir ${titleNoun}` : employee.nombre}</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <FormField id="employee-nombre" label="Nombre" required error={errors.nombre}>
          <input
            ref={nameRef}
            id="employee-nombre"
            type="text"
            autoComplete="off"
            value={values.nombre}
            onChange={(event) => update("nombre", event.target.value)}
            placeholder="Ej.: Ana García"
            aria-required="true"
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "employee-nombre-error" : undefined}
            className={errors.nombre ? "is-invalid" : ""}
          />
        </FormField>

        {!isInternal && !lockedCompanyId ? (
          <FormField id="employee-empresa" label="Cliente" error={errors.empresa_id}>
            <select
              id="employee-empresa"
              value={values.empresa_id}
              onChange={(event) => update("empresa_id", event.target.value)}
              aria-invalid={Boolean(errors.empresa_id)}
              className={errors.empresa_id ? "is-invalid" : ""}
            >
              <option value="">Sin cliente</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.nombre}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        <FormField id="employee-cargo" label="Cargo">
          <input
            id="employee-cargo"
            type="text"
            autoComplete="off"
            value={values.cargo}
            onChange={(event) => update("cargo", event.target.value)}
            placeholder="Ej.: Responsable de compras"
          />
        </FormField>

        <div className="form-row">
          <FormField
            id="employee-email"
            label="Email"
            error={errors.email}
            help={errors.email ? undefined : "Usaremos este correo para contactar."}
          >
            <input
              id="employee-email"
              type="email"
              autoComplete="off"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="Ej.: ana@empresa.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "employee-email-error" : "employee-email-help"
              }
              className={errors.email ? "is-invalid" : ""}
            />
          </FormField>

          <FormField id="employee-telefono" label="Teléfono" error={errors.telefono}>
            <input
              id="employee-telefono"
              type="tel"
              autoComplete="off"
              value={values.telefono}
              onChange={(event) => update("telefono", event.target.value)}
              placeholder="Ej.: 600 123 456"
              aria-invalid={Boolean(errors.telefono)}
              aria-describedby={errors.telefono ? "employee-telefono-error" : undefined}
              className={errors.telefono ? "is-invalid" : ""}
            />
          </FormField>
        </div>

        <FormField id="employee-notas" label="Notas">
          <textarea
            id="employee-notas"
            rows={4}
            value={values.notas}
            onChange={(event) => update("notas", event.target.value)}
          />
        </FormField>

        {!isNew && (
          <dl className="form-dates">
            <div>
              <dt>Creado</dt>
              <dd>{formatDate(employee.created_at)}</dd>
            </div>
            <div>
              <dt>Última modificación</dt>
              <dd>{formatDate(employee.updated_at)}</dd>
            </div>
          </dl>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : isNew ? `Guardar ${titleNoun}` : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteEmployeeDialog({
  employee,
  opportunitiesCount,
  deleting,
  onConfirm,
  onClose,
}: {
  employee: Employee;
  opportunitiesCount: number;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal titleId="employee-delete-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Eliminar</div>
          <h3 id="employee-delete-title">¿Eliminar a «{employee.nombre}»?</h3>
        </div>
        <CloseButton label="Cancelar" onClick={onClose} />
      </div>

      <div className="modal-warning" role="alert">
        Esta acción <strong>no se puede deshacer</strong>.
      </div>

      {opportunitiesCount > 0 && (
        <p className="modal-text">
          {opportunitiesCount === 1 ? "1 oportunidad" : `${opportunitiesCount} oportunidades`} no se{" "}
          {opportunitiesCount === 1 ? "borrará" : "borrarán"}, pero {opportunitiesCount === 1 ? "quedará" : "quedarán"}{" "}
          <strong>sin persona asignada</strong>.
        </p>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Eliminando..." : "Sí, eliminar"}
        </button>
      </div>
    </Modal>
  );
}
