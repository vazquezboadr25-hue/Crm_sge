"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseButton, Modal, formatDate } from "@/components/Modal";

export type Employee = {
  id: string;
  nombre: string;
  email: string | null;
  empresa_id: string | null;
  cargo: string | null;
  telefono: string | null;
  notas: string | null;
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
  companies,
  existingEmails,
  saving,
  onSave,
  onClose,
}: {
  employee: Employee | null;
  companies: Array<{ id: string; nombre: string }>;
  existingEmails: string[];
  saving: boolean;
  onSave: (values: EmployeeFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<EmployeeFormValues>({
    nombre: employee?.nombre ?? "",
    email: employee?.email ?? "",
    empresa_id: employee?.empresa_id ?? "",
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
      nextErrors.nombre = "Escribe el nombre del empleado.";
    }

    if (email) {
      if (!emailPattern.test(email)) {
        nextErrors.email = "Escribe un correo válido, por ejemplo: nombre@empresa.com";
      } else if (existingEmails.some((existing) => existing.trim().toLowerCase() === email)) {
        nextErrors.email = "Ya hay otro empleado con este correo.";
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
      empresa_id: values.empresa_id,
      cargo: values.cargo.trim(),
      telefono,
      notas: values.notas.trim(),
    });
  };

  return (
    <Modal titleId="employee-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">{isNew ? "Nuevo empleado" : "Editar empleado"}</div>
          <h3 id="employee-editor-title">{isNew ? "Añadir un empleado" : employee.nombre}</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="employee-nombre">
            Nombre y apellidos <span className="form-required">(obligatorio)</span>
          </label>
          <input
            ref={nameRef}
            id="employee-nombre"
            type="text"
            autoComplete="off"
            value={values.nombre}
            onChange={(event) => update("nombre", event.target.value)}
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "employee-nombre-error" : undefined}
            className={errors.nombre ? "is-invalid" : ""}
          />
          {errors.nombre && (
            <p id="employee-nombre-error" className="form-error">
              {errors.nombre}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="employee-empresa">Empresa</label>
          <select
            id="employee-empresa"
            value={values.empresa_id}
            onChange={(event) => update("empresa_id", event.target.value)}
          >
            <option value="">Sin empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="employee-cargo">Cargo</label>
          <input
            id="employee-cargo"
            type="text"
            autoComplete="off"
            value={values.cargo}
            onChange={(event) => update("cargo", event.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="employee-email">Correo electrónico</label>
            <input
              id="employee-email"
              type="email"
              autoComplete="off"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "employee-email-error" : undefined}
              className={errors.email ? "is-invalid" : ""}
            />
            {errors.email && (
              <p id="employee-email-error" className="form-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="employee-telefono">Teléfono</label>
            <input
              id="employee-telefono"
              type="tel"
              autoComplete="off"
              value={values.telefono}
              onChange={(event) => update("telefono", event.target.value)}
              aria-invalid={Boolean(errors.telefono)}
              aria-describedby={errors.telefono ? "employee-telefono-error" : undefined}
              className={errors.telefono ? "is-invalid" : ""}
            />
            {errors.telefono && (
              <p id="employee-telefono-error" className="form-error">
                {errors.telefono}
              </p>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="employee-notas">Notas</label>
          <textarea
            id="employee-notas"
            rows={4}
            value={values.notas}
            onChange={(event) => update("notas", event.target.value)}
          />
        </div>

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
            {saving ? "Guardando..." : isNew ? "Añadir empleado" : "Guardar cambios"}
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
          <div className="detail-label">Eliminar empleado</div>
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
          <strong>sin empleado asignado</strong>.
        </p>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Eliminando..." : "Sí, eliminar empleado"}
        </button>
      </div>
    </Modal>
  );
}
