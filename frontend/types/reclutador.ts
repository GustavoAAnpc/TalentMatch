import { VacanteResumenResponse } from './vacante';

export interface ReclutadorResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  urlFoto?: string;
  telefono?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  ultimoAcceso?: string;
  departamento?: string;
  cargo?: string;
  extensionTelefonica?: string;
  descripcion?: string;
  totalVacantes?: number;
}

export interface ActualizacionReclutadorRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  puesto?: string;
  departamento?: string;
  ubicacion?: string;
  infoEmpresa?: string;
  cargo?: string;
  extensionTelefonica?: string;
  descripcion?: string;
}

export interface CandidatoTopResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  urlFoto?: string;
  profesion?: string;
  ubicacion?: string;
  habilidadesPrincipales: string[];
  aniosExperiencia?: number;
  matchPorcentaje: number;
  insight: string;
}

export interface DashboardReclutadorResponse {
  // Información básica del reclutador
  reclutador: ReclutadorResponse;
  
  // Estadísticas generales
  vacantesActivas: number;
  vacantesCerradas: number;
  vacantesTotal: number;
  candidatosTotal: number;
  candidatosAnalizados: number;
  contratacionesTotal: number;
  
  // Estadísticas de rendimiento
  diasPromedioContratacion: number;
  tasaConversion: number;
  
  // Vacantes activas del reclutador
  vacantesRecientes: VacanteResumenResponse[];
  
  // Candidatos destacados (mejores matches según IA)
  candidatosDestacados: CandidatoTopResponse[];
  
  // Análisis de habilidades más demandadas
  habilidadesDestacadas: {nombre: string, cantidad: number}[];
  
  // Insights generados por IA
  insightsIA: string[];
} 