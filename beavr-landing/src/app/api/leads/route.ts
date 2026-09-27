import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LeadPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  projectType?: unknown;
  details?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const projectTypes = new Set(["ui-design", "frontend", "website", "full"]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

async function findOrCreateEmpresa(supabase: SupabaseClient, nombre: string) {
  const { data: existing, error: findError } = await supabase
    .from("empresas")
    .select("id")
    .ilike("nombre", escapeLike(nombre))
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id as string;

  const { data: created, error: createError } = await supabase
    .from("empresas")
    .insert({ nombre })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id as string;
}

async function findOrCreatePersona(
  supabase: SupabaseClient,
  nombre: string,
  email: string,
  empresaId: string | null,
) {
  const { data: existing, error: findError } = await supabase
    .from("personas")
    .select("id, empresa_id")
    .ilike("email", escapeLike(email))
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    if (!existing.empresa_id && empresaId) {
      await supabase.from("personas").update({ empresa_id: empresaId }).eq("id", existing.id);
    }
    return existing.id as string;
  }

  const { data: created, error: createError } = await supabase
    .from("personas")
    .insert({ nombre, email, empresa_id: empresaId })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id as string;
}

export async function POST(request: Request) {
  let body: LeadPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "No hemos podido leer el formulario. Recarga la página e inténtalo de nuevo." },
      { status: 400 },
    );
  }

  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const company = text(body.company);
  const projectType = text(body.projectType);
  const details = text(body.details);

  if (!name || !email || !projectType || !details) {
    return NextResponse.json(
      { error: "Completa nombre, email, tipo de proyecto y detalles." },
      { status: 400 },
    );
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }

  if (!projectTypes.has(projectType)) {
    return NextResponse.json({ error: "Selecciona un tipo de proyecto válido." }, { status: 400 });
  }

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    console.error("[beavr] Configuración de Supabase incompleta:", error);
    return NextResponse.json(
      { error: "El servicio de contacto no está disponible ahora mismo. Escríbenos por email." },
      { status: 503 },
    );
  }

  let empresaId: string | null = null;
  let personaId: string | null = null;

  if (company) {
    try {
      empresaId = await findOrCreateEmpresa(supabase, company);
    } catch (error) {
      console.error("[beavr] No se pudo vincular la empresa:", error);
    }
  }

  try {
    personaId = await findOrCreatePersona(supabase, name, email, empresaId);
  } catch (error) {
    console.error("[beavr] No se pudo vincular la persona:", error);
  }

  try {
    const { error } = await supabase.from("oportunidades").insert({
      nombre: name,
      correo: email,
      empresa_id: empresaId,
      persona_id: personaId,
      proyecto: projectType,
      detalles: details,
      origen: "landing-beavr",
      estado: "new",
    });

    if (error) {
      console.error("[beavr] Error al guardar oportunidad:", error);
      return NextResponse.json(
        { error: "No hemos podido registrar tu solicitud. Inténtalo de nuevo en unos minutos." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[beavr] Error de conexión con Supabase:", error);
    return NextResponse.json(
      { error: "No hemos podido conectar con el CRM. Inténtalo de nuevo en unos minutos." },
      { status: 502 },
    );
  }
}
