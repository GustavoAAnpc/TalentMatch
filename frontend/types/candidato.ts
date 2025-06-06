// Respuesta de candidato
export interface CandidatoResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  pais?: string;
  ciudad?: string;
  direccion?: string;
  codigoPostal?: string;
  tituloProfesional?: string;
  resumenPerfil?: string;
  urlFoto?: string;
  urlCurriculum?: string;
  experienciaAnios?: number;
  habilidadesPrincipales?: string;
  idiomas?: string;
  certificaciones?: string;
  educacion?: string;
  experienciaLaboral?: string;
  urlLinkedin?: string;
  urlGithub?: string;
  urlPortafolio?: string;
  nivelEducativo?: string;
  institucionEducativa?: string;
  especialidad?: string;
  disponibilidadViajar?: boolean;
  disponibilidadCambioResidencia?: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// Detalle del candidato
export interface CandidatoDetalleResponse extends CandidatoResponse {
  postulaciones?: number;
  pruebasTecnicas?: number;
  vacantesRecomendadas?: number;
}

// Actualización de candidato
export interface ActualizacionCandidatoRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fechaNacimiento?: string;
  pais?: string;
  ciudad?: string;
  direccion?: string;
  codigoPostal?: string;
  tituloProfesional?: string;
  resumenPerfil?: string;
  experienciaAnios?: number;
  habilidadesPrincipales?: string;
  idiomas?: string;
  certificaciones?: string;
  educacion?: string;
  experienciaLaboral?: string;
  urlLinkedin?: string;
  urlGithub?: string;
  urlPortafolio?: string;
  nivelEducativo?: string;
  institucionEducativa?: string;
  especialidad?: string;
  disponibilidadViajar?: boolean;
  disponibilidadCambioResidencia?: boolean;
}

// Respuesta del análisis de perfil
export interface AnalisisPerfilResponse {
  id: number;
  candidatoId: number;
  perfilCompleto: boolean;
  seccionesCompletas: string[];
  seccionesFaltantes: string[];
  sugerencias: string[];
  puntuacion: number;
  fechaAnalisis: string;
}

// Respuesta del emparejamiento
export interface EmparejamientoResponse {
  porcentaje: number;
  fortalezas: string[];
  debilidades: string[];
  recomendaciones: string[];
  fechaCalculo: string;
  mensajeCandidato?: string;
  mensajeReclutador?: string;
} 