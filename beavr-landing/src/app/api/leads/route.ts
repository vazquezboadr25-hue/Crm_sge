import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LeadPayload = {
  name?: string;
  email?: string;
  company?: string;
  projectType?: string;
  details?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: LeadPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const company = body.company?.trim() ?? "";
  const projectType = body.projectType?.trim() ?? "";
  const details = body.details?.trim() ?? "";

  if (!name || !email || !projectType || !details) {
    return NextResponse.json(
      { error: "Completa nombre, email, tipo de proyecto y detalles." },
      { status: 400 },
    );
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("oportunidades").insert({
      nombre: name,
      correo: email,
      empresa: company || null,
      proyecto: projectType,
      detalles: details,
      origen: "landing-beavr",
      estado: "nueva",
    });

    if (error) {
      console.error("[beavr] Error al guardar oportunidad:", error);
      return NextResponse.json(
        { error: "No se pudo guardar en el CRM. Inténtalo de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[beavr] Error de conexión Supabase:", error);
    return NextResponse.json(
      { error: "Error de conexión con el CRM." },
      { status: 500 },
    );
  }
}
