export type EstadoLaboral = "activo" | "baja";
export type VacacionEstado = "pendiente" | "aprobada" | "rechazada";
export type AdmisionEstado = "en_proceso" | "contratado" | "descartado";

export type StaffMember = {
  id: string;
  nombre: string;
  email: string | null;
  cargo: string | null;
  telefono: string | null;
  notas: string | null;
  foto_url: string | null;
  estado_laboral: EstadoLaboral;
  fecha_alta: string | null;
  es_interno: boolean;
  created_at: string;
  updated_at: string;
};

export type Fichaje = {
  id: string;
  persona_id: string;
  entrada_en: string;
  salida_en: string | null;
  notas: string | null;
  created_at: string;
};

export type Vacacion = {
  id: string;
  persona_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: VacacionEstado;
  motivo: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingItem = {
  id: string;
  persona_id: string;
  titulo: string;
  completado: boolean;
  completado_en: string | null;
  orden: number;
  created_at: string;
};

export type Admision = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  puesto: string | null;
  cv_url: string | null;
  estado: AdmisionEstado;
  notas: string | null;
  persona_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Evaluacion = {
  id: string;
  persona_id: string;
  periodo: string;
  nota: number;
  comentario: string | null;
  evaluador: string | null;
  created_at: string;
};

export type Nomina = {
  id: string;
  persona_id: string;
  periodo: string;
  archivo_url: string;
  archivo_nombre: string | null;
  firmado: boolean;
  firmado_en: string | null;
  firmado_por: string | null;
  created_at: string;
};

export const DEFAULT_ONBOARDING = [
  "Entregar portátil / equipo",
  "Crear correo corporativo",
  "Dar acceso a herramientas internas",
  "Firmar documentación de bienvenida",
  "Presentación al equipo",
] as const;

export const ESTADO_LABORAL_LABELS: Record<EstadoLaboral, string> = {
  activo: "Activo",
  baja: "Baja",
};

export const VACACION_LABELS: Record<VacacionEstado, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const ADMISION_LABELS: Record<AdmisionEstado, string> = {
  en_proceso: "En proceso",
  contratado: "Contratado",
  descartado: "Descartado",
};

export function mapStaffRow(person: Record<string, unknown>): StaffMember {
  const estado = person.estado_laboral === "baja" ? "baja" : "activo";
  return {
    id: String(person.id),
    nombre: (person.nombre as string) ?? "Sin nombre",
    email: (person.email as string | null) ?? null,
    cargo: (person.cargo as string | null) ?? null,
    telefono: (person.telefono as string | null) ?? null,
    notas: (person.notas as string | null) ?? null,
    foto_url: (person.foto_url as string | null) ?? null,
    estado_laboral: estado,
    fecha_alta: (person.fecha_alta as string | null) ?? null,
    es_interno: Boolean(person.es_interno),
    created_at: String(person.created_at),
    updated_at: String(person.updated_at),
  };
}

export function currentQuarterLabel(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `T${q} ${date.getFullYear()}`;
}

export function mapAdmisionRow(row: Record<string, unknown>): Admision {
  const estado =
    row.estado === "contratado" || row.estado === "descartado" ? row.estado : "en_proceso";
  return {
    id: String(row.id),
    nombre: (row.nombre as string) ?? "Sin nombre",
    email: (row.email as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    puesto: (row.puesto as string | null) ?? null,
    cv_url: (row.cv_url as string | null) ?? null,
    estado,
    notas: (row.notas as string | null) ?? null,
    persona_id: (row.persona_id as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export { formatDateEs, formatDateTimeEs } from "@/lib/crm/format";
