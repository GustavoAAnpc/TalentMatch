import { CandidatoResponse } from './candidato';
import { VacanteResumenResponse, VacanteDetalleResponse } from './vacante';

// Enumeración de estados de postulación
export enum EstadoPostulacion {
  APLICADA = 'APLICADA',
  EN_REVISION = 'EN_REVISION',
  PRUEBA_PENDIENTE = 'PRUEBA_PENDIENTE',
  PRUEBA_COMPLETADA = 'PRUEBA_COMPLETADA',
  ENTREVISTA = 'ENTREVISTA',
  SELECCIONADO = 'SELECCIONADO',
  RECHAZADO = 'RECHAZADO'
}

// Respuesta detallada de una postulación
export interface PostulacionDetalleResponse {
  id: number;
  candidato: CandidatoResponse;
  vacante: VacanteDetalleResponse;
  estado: EstadoPostulacion;
  cartaPresentacion?: string;
  puntuacionMatch?: number;
  comentariosReclutador?: string;
  fechaEntrevista?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// Respuesta resumida de una postulación
export interface PostulacionResumenResponse {
  id: number;
  candidatoId: number;
  candidatoNombre: string;
  vacanteId: number;
  vacanteTitulo: string;
  estado: EstadoPostulacion;
  puntuacionMatch?: number;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// Solicitud para crear una postulación
export interface CreacionPostulacionRequest {
  vacanteId: number;
  cartaPresentacion?: string;
}

// Solicitud para cambiar el estado de una postulación
export interface CambioEstadoPostulacionRequest {
  nuevoEstado: EstadoPostulacion;
  comentarios?: string;
  fechaEntrevista?: string;
} 