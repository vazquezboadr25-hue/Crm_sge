"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/FormField";
import { CloseButton, Modal } from "@/components/Modal";
import { STAGE_LABELS, STAGE_ORDER, type Stage } from "@/lib/crm/stages";
import { parsePriceInput } from "@/lib/crm/money";

export type OpportunityRecord = {
  id: string;
  nombre: string;
  correo: string;
  proyecto: string;
  detalles: string;
  origen: string;
  estado: Stage;
  precio: number | null;
  empresa_id: string | null;
  persona_id: string | null;
  creado_en: string;
};

export type OpportunityFormValues = {
  nombre: string;
  correo: string;
  proyecto: string;
  detalles: string;
  precio: string;
  empresa_id: string;
  persona_id: string;
  estado: Stage;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OpportunityEditor({
  opportunity,
  companies,
  employees,
  saving,
  onSave,
  onClose,
}: {
  opportunity: OpportunityRecord;
  companies: Array<{ id: string; nombre: string }>;
  employees: Array<{ id: string; nombre: string; email?: string | null; empresa_id: string | null }>;
  saving: boolean;
  onSave: (values: OpportunityFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<OpportunityFormValues>({
    nombre: opportunity.nombre,
    correo: opportunity.correo,
    proyecto: opportunity.proyecto,
    detalles: opportunity.detalles,
    precio: opportunity.precio != null ? String(opportunity.precio) : "",
    empresa_id: opportunity.empresa_id ?? "",
    persona_id: opportunity.persona_id ?? "",
    estado: opportunity.estado,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OpportunityFormValues, string>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const filteredEmployees = values.empresa_id
    ? employees.filter((employee) => !employee.empresa_id || employee.empresa_id === values.empresa_id)
    : employees;
  const linkedEmployee = values.persona_id
    ? employees.find((employee) => employee.id === values.persona_id) ?? null
    : null;
  const contactName = linkedEmployee ? linkedEmployee.nombre : values.nombre;
  const contactEmail = linkedEmployee ? linkedEmployee.email || values.correo : values.correo;

  const update = (field: keyof OpportunityFormValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "empresa_id") {
        const stillValid = employees.some(
          (employee) =>
            employee.id === current.persona_id &&
            (!value || !employee.empresa_id || employee.empresa_id === value),
        );
        if (!stillValid) next.persona_id = "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nombre = contactName.trim();
    const correo = contactEmail.trim().toLowerCase();
    const proyecto = values.proyecto.trim();
    const precio = parsePriceInput(values.precio);
    const nextErrors: typeof errors = {};

    if (!nombre) nextErrors.nombre = "Escribe el nombre del contacto.";
    if (!correo) nextErrors.correo = "Escribe el correo.";
    else if (!emailPattern.test(correo)) nextErrors.correo = "Escribe un correo válido.";
    if (!proyecto) nextErrors.proyecto = "Escribe el nombre del proyecto.";
    if (values.precio.trim() && Number.isNaN(precio as number)) {
      nextErrors.precio = "Escribe un precio válido, por ejemplo: 4500";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      ...values,
      nombre,
      correo,
      proyecto,
      detalles: values.detalles.trim(),
      precio: values.precio.trim(),
    });
  };

  return (
    <Modal titleId="opportunity-editor-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Editar oportunidad</div>
          <h3 id="opportunity-editor-title">{opportunity.proyecto}</h3>
        </div>
        <CloseButton label="Cerrar sin guardar" onClick={onClose} />
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <FormField id="opp-proyecto" label="Proyecto" required error={errors.proyecto}>
          <input
            ref={nameRef}
            id="opp-proyecto"
            type="text"
            value={values.proyecto}
            onChange={(event) => update("proyecto", event.target.value)}
            placeholder="Ej.: App de reservas"
            aria-required="true"
            aria-describedby={errors.proyecto ? "opp-proyecto-error" : undefined}
            className={errors.proyecto ? "is-invalid" : ""}
          />
        </FormField>

        <FormField
          id="opp-precio"
          label="Precio (€)"
          error={errors.precio}
          help={errors.precio ? undefined : "Importe estimado de la oportunidad."}
        >
          <input
            id="opp-precio"
            type="text"
            inputMode="decimal"
            value={values.precio}
            onChange={(event) => update("precio", event.target.value)}
            className={errors.precio ? "is-invalid" : ""}
            placeholder="Ej.: 4500"
            aria-describedby={errors.precio ? "opp-precio-error" : "opp-precio-help"}
          />
        </FormField>

        <div className="form-row">
          <FormField
            id="opp-nombre"
            label="Nombre"
            required
            error={errors.nombre}
            help={linkedEmployee ? "Se toma del contacto vinculado." : undefined}
          >
            <input
              id="opp-nombre"
              type="text"
              value={contactName}
              onChange={(event) => update("nombre", event.target.value)}
              readOnly={Boolean(linkedEmployee)}
              placeholder="Ej.: Ana García"
              aria-required="true"
              aria-describedby={
                errors.nombre
                  ? "opp-nombre-error"
                  : linkedEmployee
                    ? "opp-nombre-help"
                    : undefined
              }
              className={errors.nombre ? "is-invalid" : ""}
            />
          </FormField>
          <FormField id="opp-correo" label="Email" required error={errors.correo}>
            <input
              id="opp-correo"
              type="email"
              value={contactEmail}
              onChange={(event) => update("correo", event.target.value)}
              readOnly={Boolean(linkedEmployee)}
              placeholder="Ej.: ana@empresa.com"
              aria-required="true"
              aria-describedby={errors.correo ? "opp-correo-error" : undefined}
              className={errors.correo ? "is-invalid" : ""}
            />
          </FormField>
        </div>

        <div className="form-row">
          <FormField id="opp-empresa" label="Cliente">
            <select
              id="opp-empresa"
              value={values.empresa_id}
              onChange={(event) => update("empresa_id", event.target.value)}
            >
              <option value="">Sin cliente</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.nombre}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            id="opp-empleado"
            label="Contacto vinculado"
            help="Persona del cliente asociada a esta oportunidad."
          >
            <select
              id="opp-empleado"
              value={values.persona_id}
              onChange={(event) => update("persona_id", event.target.value)}
              aria-describedby="opp-empleado-help"
            >
              <option value="">Sin contacto</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nombre}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField id="opp-estado" label="Estado">
          <select
            id="opp-estado"
            value={values.estado}
            onChange={(event) => update("estado", event.target.value)}
          >
            {STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="opp-detalles" label="Descripción">
          <textarea
            id="opp-detalles"
            rows={4}
            value={values.detalles}
            onChange={(event) => update("detalles", event.target.value)}
          />
        </FormField>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteOpportunityDialog({
  opportunity,
  deleting,
  onConfirm,
  onClose,
}: {
  opportunity: OpportunityRecord;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal titleId="opportunity-delete-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <div className="detail-label">Eliminar oportunidad</div>
          <h3 id="opportunity-delete-title">¿Eliminar «{opportunity.proyecto}»?</h3>
        </div>
        <CloseButton label="Cancelar" onClick={onClose} />
      </div>

      <div className="modal-warning" role="alert">
        Esta acción <strong>no se puede deshacer</strong>.
      </div>

      <p className="modal-text">Se borrará la negociación con {opportunity.nombre}.</p>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Eliminando..." : "Sí, eliminar oportunidad"}
        </button>
      </div>
    </Modal>
  );
}
