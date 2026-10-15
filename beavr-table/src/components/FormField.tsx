import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string | null;
  children: ReactNode;
};

/**
 * Campo según skill ERP: etiqueta siempre visible, * si obligatorio,
 * ayuda breve debajo y error junto al campo.
 * El control hijo debe usar el mismo `id` (y aria-describedby si aplica).
 */
export function FormField({ id, label, required, help, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="form-help">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function RequiredMark() {
  return (
    <span className="form-required" aria-hidden="true">
      {" "}
      *
    </span>
  );
}
