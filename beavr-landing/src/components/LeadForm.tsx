"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function LeadForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          projectType: data.get("projectType"),
          details: data.get("details"),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar el formulario");
      }

      setState("success");
      setMessage("Gracias. Hemos recibido tu mensaje y te contactaremos pronto.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Algo salió mal. Inténtalo de nuevo en unos minutos.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="lead-form space-y-4" noValidate>
      <div className="lead-form-intro">
        <p className="lead-form-kicker">Empieza aquí</p>
        <h3 className="lead-form-title">Cuéntanos tu proyecto</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-beavr-deep">Nombre</span>
          <input
            className="field"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Ana García"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-beavr-deep">Email</span>
          <input
            className="field"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ana@empresa.com"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-beavr-deep">Empresa</span>
          <input
            className="field"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Tu empresa"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-beavr-deep">Tipo de proyecto</span>
          <select className="field" name="projectType" required defaultValue="">
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="ui-design">Diseño de pantallas / UI</option>
            <option value="frontend">Frontend de aplicación</option>
            <option value="website">Página web</option>
            <option value="full">Diseño + frontend</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-beavr-deep">Cuéntanos el proyecto</span>
        <textarea
          className="field min-h-28 resize-y"
          name="details"
          required
          placeholder="Qué necesitas, plazos y objetivos..."
        />
      </label>

      <button type="submit" className="btn-accent w-full" disabled={state === "loading"}>
        {state === "loading" ? "Enviando..." : "Enviar y hablar con beavr"}
      </button>

      {message ? (
        <p
          role="status"
          className={`text-sm ${state === "success" ? "text-beavr-soft" : "text-accent"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
