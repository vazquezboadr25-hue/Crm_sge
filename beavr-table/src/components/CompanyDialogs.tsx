"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { EntityLogo } from "@/components/EntityLogo";
import { CloseButton, Modal, formatDate } from "@/components/Modal";
import { validateLogoFile } from "@/lib/crm/companyLogo";

export type Company = {
  id: string;
  nombre: string;
  nif: string | null;
  sector: string | null;
  sitio_web: string | null;
  notas: string | null;
  logo_url: string | null;
  responsable_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyFormValues = {
  nombre: string;
  nif: string;
  sector: string;
  sitio_web: string;
  notas: string;
  responsable_id: string;
  logoFile: File | null;
  removeLogo: boolean;
};

type CompanyTextField = "nombre" | "nif" | "sector" | "sitio_web" | "notas" | "responsable_id";

export type CompanyEmployeeOption = {
  id: string;
  nombre: string;
  cargo: string | null;
};

export function CompanyEditor({
  company,
  employees = [],
  existingNames,
  saving,
  onSave,
  onClose,
}: {
  company: Company | null;
  employees?: CompanyEmployeeOption[];
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
    responsable_id:
      company?.responsable_id && employees.some((employee) => employee.id === company.responsable_id)
        ? company.responsable_id
        : "",
    logoFile: null,
    removeLogo: false,
  });
  const [errors, setErrors] = useState<Partial<Record<CompanyTextField | "logo", string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const isNew = company === null;
  const currentLogo = logoPreview ?? (values.removeLogo ? null : company?.logo_url ?? null);

  const update = (field: CompanyTextField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const error = validateLogoFile(file);
    setErrors((current) => ({ ...current, logo: error ?? undefined }));
    if (error) return;

    setValues((current) => ({ ...current, logoFile: file, removeLogo: false }));
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setValues((current) => ({ ...current, logoFile: null, removeLogo: Boolean(company?.logo_url) }));
    setLogoPreview(null);
    setErrors((current) => ({ ...current, logo: undefined }));
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

    if (values.responsable_id && !employees.some((employee) => employee.id === values.responsable_id)) {
      nextErrors.responsable_id = "Elige a una persona que trabaje en esta empresa.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      nombre,
      nif: values.nif.trim().toUpperCase(),
      sector: values.sector.trim(),
      sitio_web: sitioWeb,
      notas: values.notas.trim(),
      responsable_id: values.responsable_id,
      logoFile: values.logoFile,
      removeLogo: values.removeLogo,
    });
  };

  return (
    <Modal titleId="company-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">{isNew ? "Nueva empresa" : "Editar empresa"}</div>
          <h3 id="company-editor-title">{isNew ? "Añadir una empresa" : company.nombre}</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="company-logo">Logo de la empresa</label>
          <div className="logo-field">
            <EntityLogo name={values.nombre || company?.nombre || "Empresa"} size="lg" logoUrl={currentLogo} />
            <div className="logo-field-actions">
              <input
                ref={logoInputRef}
                id="company-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="visually-hidden"
                onChange={handleLogoChange}
                aria-describedby={errors.logo ? "company-logo-error" : "company-logo-help"}
                aria-invalid={Boolean(errors.logo)}
                tabIndex={-1}
              />
              <div className="logo-field-buttons">
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={saving}
                >
                  {currentLogo ? "Cambiar logo" : "Subir logo"}
                </button>
                {currentLogo && (
                  <button type="button" className="btn btn-ghost" onClick={handleRemoveLogo} disabled={saving}>
                    Quitar logo
                  </button>
                )}
              </div>
              {errors.logo ? (
                <p id="company-logo-error" className="form-error" role="alert">
                  {errors.logo}
                </p>
              ) : (
                <p id="company-logo-help" className="form-help">
                  PNG, JPG, WEBP o SVG de hasta 2 MB. Si no subes ninguno, se muestran las iniciales.
                </p>
              )}
            </div>
          </div>
        </div>

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
          <label htmlFor="company-responsable">Responsable de comunicación con beavr</label>
          <select
            id="company-responsable"
            value={values.responsable_id}
            onChange={(event) => update("responsable_id", event.target.value)}
            disabled={employees.length === 0}
            aria-invalid={Boolean(errors.responsable_id)}
            aria-describedby={errors.responsable_id ? "company-responsable-error" : "company-responsable-help"}
            className={errors.responsable_id ? "is-invalid" : ""}
          >
            <option value="">Sin responsable</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.cargo ? `${employee.nombre} · ${employee.cargo}` : employee.nombre}
              </option>
            ))}
          </select>
          {errors.responsable_id ? (
            <p id="company-responsable-error" className="form-error">
              {errors.responsable_id}
            </p>
          ) : (
            <p id="company-responsable-help" className="form-help">
              {employees.length
                ? "Persona de la empresa que habla con beavr."
                : isNew
                  ? "Podrás elegirlo cuando la empresa tenga empleados."
                  : "Añade empleados a la empresa para poder elegir responsable."}
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
        <CloseButton label="Cancelar" onClick={onClose} />
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
