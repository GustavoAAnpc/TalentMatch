// Estado de una vacante
export enum EstadoVacante {
  ACTIVA = 'ACTIVA',
  PAUSADA = 'PAUSADA',
  CERRADA = 'CERRADA',
  BORRADOR = 'BORRADOR',
  ELIMINADA = 'ELIMINADA'
}

// DTO para crear una vacante
export interface CreacionVacanteRequest {
  titulo: string;
  descripcion: string;
  area?: string;
  ubicacion?: string;
  destacada?: boolean;
  modalidad?: string;
  tipoContrato?: string;
  salarioMinimo?: number;
  salarioMaximo?: number;
  mostrarSalario?: boolean;
  experienciaRequerida?: string;
  experienciaMinima?: number;
  habilidadesRequeridas?: string;
  requisitosAdicionales?: string;
  beneficios?: string;
  // Formato ISO: "YYYY-MM-DD" (se convertirá a "YYYY-MM-DDT00:00:00" para el backend)
  fechaPublicacion?: string;
  // Formato ISO: "YYYY-MM-DD" (se convertirá a "YYYY-MM-DDT23:59:59" para el backend)
  fechaCierre?: string;
}

// Respuesta resumida de vacante
export interface VacanteResumenResponse {
  id: number;
  titulo: string;
  descripcion: string;
  area?: string;
  ubicacion?: string;
  modalidad?: string;
  tipoContrato?: string;
  salarioMinimo?: number;
  salarioMaximo?: number;
  mostrarSalario?: boolean;
  experienciaRequerida?: number;
  fechaPublicacion?: string;
  fechaCierre?: string;
  estado: EstadoVacante;
  fechaCreacion: string;
  fechaActualizacion?: string;
  empresa?: string;
  totalPostulaciones?: number;
  esFavorita?: boolean;
}

// Respuesta detallada de vacante
export interface VacanteDetalleResponse extends VacanteResumenResponse {
  habilidadesRequeridas?: string;
  requisitosAdicionales?: string;
  beneficios?: string;
  reclutador: ReclutadorResumidoResponse;
}

// Respuesta resumida de reclutador
export interface ReclutadorResumidoResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  puesto?: string;
  departamento?: string;
  empresa?: string;
  urlFoto?: string;
}

// Solicitud para actualizar una vacante
export interface ActualizacionVacanteRequest {
  titulo?: string;
  descripcion?: string;
  area?: string;
  ubicacion?: string;
  destacada?: boolean;
  modalidad?: string;
  tipoContrato?: string;
  salarioMinimo?: number;
  salarioMaximo?: number;
  mostrarSalario?: boolean;
  experienciaRequerida?: number;
  experienciaMinima?: number;
  habilidadesRequeridas?: string;
  requisitosAdicionales?: string;
  beneficios?: string;
  fechaPublicacion?: string;
  fechaCierre?: string;
} 