import type { Company } from "@/components/CompanyDialogs";
import type { Employee } from "@/components/EmployeeDialogs";
import { mapStaffRow, type StaffMember } from "@/lib/crm/rrhh";
import { normalizeStage, type Stage } from "@/lib/crm/stages";

type Row = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function mapCompanyRow(row: Row): Company {
  return {
    id: String(row.id),
    nombre: str(row.nombre, "Sin nombre"),
    nif: strOrNull(row.nif),
    sector: strOrNull(row.sector),
    sitio_web: strOrNull(row.sitio_web),
    notas: strOrNull(row.notas),
    logo_url: strOrNull(row.logo_url),
    responsable_id: strOrNull(row.responsable_id),
    created_at: str(row.created_at, new Date().toISOString()),
    updated_at: str(row.updated_at, new Date().toISOString()),
  };
}

export function mapContactRow(row: Row): Employee {
  return {
    id: String(row.id),
    nombre: str(row.nombre, "Sin nombre"),
    email: strOrNull(row.email),
    empresa_id: strOrNull(row.empresa_id),
    cargo: strOrNull(row.cargo),
    telefono: strOrNull(row.telefono),
    notas: strOrNull(row.notas),
    es_interno: Boolean(row.es_interno),
    created_at: str(row.created_at, new Date().toISOString()),
    updated_at: str(row.updated_at, new Date().toISOString()),
  };
}

export function mapInternalStaff(rows: Row[]): StaffMember[] {
  return rows.filter((row) => Boolean(row.es_interno)).map((row) => mapStaffRow(row));
}

export function mapExternalContacts(rows: Row[]): Employee[] {
  return rows.filter((row) => !row.es_interno).map((row) => mapContactRow(row));
}

export type MappedOpportunity = {
  id: string;
  nombre: string;
  empresa: string;
  empresa_id: string | null;
  persona_id: string | null;
  proyecto: string;
  email: string;
  detalles: string;
  precio: number | null;
  estado: Stage;
  creado_en: string;
};

export function mapOpportunityRow(
  row: Row,
  personById: Map<string, { nombre: string; email: string; empresa: string }>,
  companyById: Map<string, string>,
): MappedOpportunity {
  const personaId = strOrNull(row.persona_id);
  const empresaId = strOrNull(row.empresa_id);
  const linkedPerson = personaId ? personById.get(personaId) : null;
  const linkedCompany = empresaId ? companyById.get(empresaId) : null;
  const empresa =
    strOrNull(row.empresa) ?? linkedCompany ?? linkedPerson?.empresa ?? "Sin empresa";

  return {
    id: String(row.id),
    nombre: linkedPerson?.nombre ?? str(row.nombre, "Sin nombre"),
    empresa,
    empresa_id: empresaId,
    persona_id: personaId,
    proyecto: str(row.proyecto, "Sin proyecto"),
    email: linkedPerson?.email ?? str(row.correo, "Sin email"),
    detalles: str(row.detalles, "Sin detalles"),
    precio: row.precio != null ? Number(row.precio) : null,
    estado: normalizeStage(typeof row.estado === "string" ? row.estado : null),
    creado_en: str(row.creado_en, new Date().toISOString()),
  };
}
