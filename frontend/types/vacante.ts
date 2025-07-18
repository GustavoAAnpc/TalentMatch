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
  empresa?: string;
  ubicacion?: string;
  modalidad?: string;
  fechaPublicacion: string;
  fechaCierre?: string;
  estado: string;
  postulacionesCount?: number;
  destacada?: boolean;
  salarioMinimo?: number;
  salarioMaximo?: number;
  mostrarSalario?: boolean;
  experienciaRequerida?: string;
  reclutador?: ReclutadorResumidoResponse;
}

// Respuesta detallada de vacante
export interface VacanteDetalleResponse extends VacanteResumenResponse {
  descripcion: string;
  area?: string;
  tipoContrato?: string;
  experienciaMinima?: number;
  habilidadesRequeridas?: string;
  requisitosAdicionales?: string;
  beneficios?: string;
  reclutador: ReclutadorResumidoResponse;
  requierePrueba?: boolean;
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