"use client";

import { ChangeEvent, CSSProperties, FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";
type Field = "projectType" | "details" | "name" | "email";
type Errors = Partial<Record<Field, string>>;

const projects = [
  { value: "ui-design", title: "Diseño de pantallas", hint: "UI, flujos y sistema visual" },
  { value: "frontend", title: "Frontend de app", hint: "Interfaz en código lista para producto" },
  { value: "website", title: "Página web", hint: "Landing o sitio que convierta" },
  { value: "full", title: "Diseño + frontend", hint: "De la pantalla al código" },
];

const nextSteps = [
  "Revisamos tu brief",
  "Te proponemos pantallas, alcance y plazos",
  "Agendamos una llamada si encaja",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const empty = { details: "", name: "", email: "", company: "", website: "" };

export default function LeadForm() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [projectType, setProjectType] = useState("");
  const [values, setValues] = useState(empty);
  const [sentTo, setSentTo] = useState("");

  const set =
    (key: keyof typeof empty) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    };

  function validate(target: number): Errors {
    const found: Errors = {};
    if (target === 0) {
      if (!projectType) found.projectType = "Elige el tipo de proyecto.";
      if (values.details.trim().length < 10) found.details = "Cuéntanos un poco más (mínimo 10 caracteres).";
    }
    if (target === 1) {
      if (!values.name.trim()) found.name = "Escribe tu nombre.";
      if (!emailPattern.test(values.email.trim())) found.email = "Escribe un email válido, por ejemplo ana@empresa.com.";
    }
    return found;
  }

  function goNext() {
    const found = validate(0);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setDir(1);
      setStep(1);
    }
  }

  function goBack() {
    setDir(-1);
    setServerError("");
    setStep(0);
  }

  async function submit() {
    const found = validate(1);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("loading");
    setServerError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          company: values.company,
          projectType,
          details: values.details,
          website: values.website,
        }),
      });

      const payload: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar el formulario. Inténtalo de nuevo.");
      }

      setSentTo(values.email.trim());
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setServerError(
        error instanceof Error ? error.message : "Algo salió mal. Inténtalo de nuevo en unos minutos.",
      );
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    if (step === 0) goNext();
    else void submit();
  }

  function reset() {
    setStep(0);
    setDir(1);
    setStatus("idle");
    setServerError("");
    setErrors({});
    setProjectType("");
    setValues(empty);
  }

  if (status === "success") {
    return (
      <div className="lf-done" role="status">
        <svg className="lf-check" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="26" fill="none" strokeWidth="3" />
          <path d="M16 29l8 8 16-17" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="lead-form-title">Mensaje recibido</h3>
        <p className="lf-done-text">
          Te escribimos a <strong>{sentTo}</strong> en 24–48 h.
        </p>
        <ol className="lf-next">
          {nextSteps.map((item, index) => (
            <li key={item} style={{ "--i": index } as CSSProperties}>
              {item}
            </li>
          ))}
        </ol>
        <button type="button" className="btn-ghost" onClick={reset}>
          Enviar otro proyecto
        </button>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <form onSubmit={onSubmit} className="lf" noValidate>
      <div className="lf-progress" aria-hidden="true">
        <span className="on" />
        <span className={step === 1 ? "on" : ""} />
      </div>
      <p className="lf-step-label">Paso {step + 1} de 2</p>

      <div key={step} className="lf-panel" style={{ "--lf-dir": `${dir * 24}px` } as CSSProperties}>
        {step === 0 ? (
          <div className="space-y-5">
            <h3 className="lead-form-title">¿Qué necesitas?</h3>

            <div>
              <p id="lf-project-label" className="lf-label">Tipo de proyecto</p>
              <div className="lf-options" role="radiogroup" aria-labelledby="lf-project-label">
                {projects.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={projectType === item.value}
                    className="lf-option"
                    onClick={() => {
                      setProjectType(item.value);
                      setErrors((current) => ({ ...current, projectType: undefined }));
                    }}
                  >
                    <strong>{item.title}</strong>
                    <small>{item.hint}</small>
                  </button>
                ))}
              </div>
              {errors.projectType ? <p className="lf-error" role="alert">{errors.projectType}</p> : null}
            </div>

            <label className="block space-y-1.5">
              <span className="lf-label">Cuéntanos el proyecto</span>
              <textarea
                className="field min-h-28 resize-y"
                name="details"
                value={values.details}
                onChange={set("details")}
                aria-invalid={Boolean(errors.details)}
                placeholder="Qué necesitas, para quién y qué objetivo tiene."
              />
              {errors.details ? <span className="lf-error" role="alert">{errors.details}</span> : null}
            </label>

          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="lead-form-title">¿Cómo te contactamos?</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="lf-label">Nombre</span>
                <input
                  className="field"
                  name="name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  value={values.name}
                  onChange={set("name")}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Ana García"
                />
                {errors.name ? <span className="lf-error" role="alert">{errors.name}</span> : null}
              </label>
              <label className="block space-y-1.5">
                <span className="lf-label">Email</span>
                <input
                  className="field"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={set("email")}
                  aria-invalid={Boolean(errors.email)}
                  placeholder="ana@empresa.com"
                />
                {errors.email ? <span className="lf-error" role="alert">{errors.email}</span> : null}
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="lf-label">Empresa (opcional)</span>
              <input
                className="field"
                name="company"
                type="text"
                autoComplete="organization"
                value={values.company}
                onChange={set("company")}
                placeholder="Tu empresa"
              />
            </label>

            <p className="lf-privacy">Usamos tus datos solo para responderte sobre este proyecto.</p>
          </div>
        )}
      </div>

      <div className="lf-hp" aria-hidden="true">
        <label>
          No rellenar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>

      {serverError ? <p className="lf-error lf-error-box" role="alert">{serverError}</p> : null}

      <div className="lf-actions">
        {step === 1 ? (
          <button type="button" className="btn-ghost" onClick={goBack} disabled={loading}>
            Atrás
          </button>
        ) : null}
        <button type="submit" className="btn-accent lf-submit" disabled={loading}>
          {loading ? <span className="lf-spin" aria-hidden="true" /> : null}
          {loading ? "Enviando…" : step === 0 ? "Continuar" : status === "error" ? "Reintentar envío" : "Enviar y hablar con beavr"}
        </button>
      </div>
    </form>
  );
}
