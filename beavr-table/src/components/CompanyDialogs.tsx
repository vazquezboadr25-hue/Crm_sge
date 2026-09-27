"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Modal, formatDate } from "@/components/Modal";

export type Company = {
  id: string;
  nombre: string;
  nif: string | null;
  sector: string | null;
  sitio_web: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyFormValues = {
  nombre: string;
  nif: string;
  sector: string;
  sitio_web: string;
  notas: string;
};

export function CompanyEditor({
  company,
  existingNames,
  saving,
  onSave,
  onClose,
}: {
  company: Company | null;
  existingNames: string[];
  saving: boolean;
  onSave: (values: CompanyFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<CompanyFormValues>({
    nombre: company?.nombre ?? "",
    nif: company?.nif ?? "",
    sector: company?.sector ?? "",
    sitio_web: company?.sitio_web ?? "",
    notas: company?.notas ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormValues, string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const isNew = company === null;

  const update = (field: keyof CompanyFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nombre = values.nombre.trim();
    const sitioWeb = values.sitio_web.trim();
    const nextErrors: typeof errors = {};

    if (!nombre) {
      nextErrors.nombre = "Escribe el nombre de la empresa.";
    } else if (existingNames.some((name) => name.trim().toLowerCase() === nombre.toLowerCase())) {
      nextErrors.nombre = "Ya existe otra empresa con este nombre.";
    }

    if (sitioWeb && (/\s/.test(sitioWeb) || !sitioWeb.includes("."))) {
      nextErrors.sitio_web = "Escribe una dirección válida, por ejemplo: www.miempresa.com";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      nombre,
      nif: values.nif.trim().toUpperCase(),
      sector: values.sector.trim(),
      sitio_web: sitioWeb,
      notas: values.notas.trim(),
    });
  };

  return (
    <Modal titleId="company-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">{isNew ? "Nueva empresa" : "Editar empresa"}</div>
          <h3 id="company-editor-title">{isNew ? "Añadir una empresa" : company.nombre}</h3>
        </div>
        <button type="button" className="detail-close" onClick={onClose} aria-label="Cerrar sin guardar">
          ×
        </button>
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="company-nombre">
            Nombre de la empresa <span className="form-required">(obligatorio)</span>
          </label>
          <input
            ref={nameRef}
            id="company-nombre"
            type="text"
            value={values.nombre}
            onChange={(event) => update("nombre", event.target.value)}
            placeholder="Ej.: Panadería López"
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "company-nombre-error" : undefined}
            className={errors.nombre ? "is-invalid" : ""}
          />
          {errors.nombre && (
            <p id="company-nombre-error" className="form-error">
              {errors.nombre}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="company-nif">NIF</label>
          <input
            id="company-nif"
            type="text"
            autoComplete="off"
            value={values.nif}
            onChange={(event) => update("nif", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="company-sector">Sector</label>
          <input
            id="company-sector"
            type="text"
            autoComplete="off"
            value={values.sector}
            onChange={(event) => update("sector", event.target.value)}
            aria-describedby="company-sector-help"
          />
          <p id="company-sector-help" className="form-help">
            A qué se dedica la empresa.
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="company-web">Página web</label>
          <input
            id="company-web"
            type="text"
            inputMode="url"
            autoComplete="off"
            value={values.sitio_web}
            onChange={(event) => update("sitio_web", event.target.value)}
            aria-invalid={Boolean(errors.sitio_web)}
            aria-describedby={errors.sitio_web ? "company-web-error" : undefined}
            className={errors.sitio_web ? "is-invalid" : ""}
          />
          {errors.sitio_web && (
            <p id="company-web-error" className="form-error">
              {errors.sitio_web}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="company-notas">Notas</label>
          <textarea
            id="company-notas"
            rows={4}
            value={values.notas}
            onChange={(event) => update("notas", event.target.value)}
            placeholder="Cualquier información útil: horarios, cómo nos conocieron, preferencias..."
          />
        </div>

        {!isNew && (
          <dl className="form-dates">
            <div>
              <dt>Creada</dt>
              <dd>{formatDate(company.created_at)}</dd>
            </div>
            <div>
              <dt>Última modificación</dt>
              <dd>{formatDate(company.updated_at)}</dd>
            </div>
          </dl>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : isNew ? "Añadir empresa" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteCompanyDialog({
  company,
  employeesCount,
  opportunitiesCount,
  deleting,
  onConfirm,
  onClose,
}: {
  company: Company;
  employeesCount: number;
  opportunitiesCount: number;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const hasLinks = employeesCount > 0 || opportunitiesCount > 0;

  return (
    <Modal titleId="company-delete-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Eliminar empresa</div>
          <h3 id="company-delete-title">¿Eliminar «{company.nombre}»?</h3>
        </div>
        <button type="button" className="detail-close" onClick={onClose} aria-label="Cancelar">
          ×
        </button>
      </div>

      <div className="modal-warning" role="alert">
        Esta acción <strong>no se puede deshacer</strong>.
      </div>

      {hasLinks && (
        <p className="modal-text">
          {employeesCount > 0 && (
            <>
              {employeesCount === 1 ? "1 empleado" : `${employeesCount} empleados`}
              {opportunitiesCount > 0 ? " y " : " "}
            </>
          )}
          {opportunitiesCount > 0 && (
            <>{opportunitiesCount === 1 ? "1 oportunidad " : `${opportunitiesCount} oportunidades `}</>
          )}
          no se borrarán, pero quedarán <strong>sin empresa asignada</strong>.
        </p>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Eliminando..." : "Sí, eliminar empresa"}
        </button>
      </div>
    </Modal>
  );
}
