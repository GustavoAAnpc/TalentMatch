// DTO para crear una prueba técnica
export interface CreacionPruebaTecnicaRequest {
  vacanteId: number;
  titulo: string;
  descripcion: string;
  instrucciones?: string;
  tiempoLimiteMinutos?: number;
  nivelDificultad?: string;
  tecnologias?: string;
  fechaCierre?: string;
  preguntas?: PreguntaRequest[];
}

// DTO para pregunta
export interface PreguntaRequest {
  enunciado: string;
  tipoPregunta?: string;
  puntuacion?: number;
  opciones?: string[];
  respuestaCorrecta?: string;
  orden?: number;
}

// Respuesta resumida de prueba técnica
export interface PruebaTecnicaResumenResponse {
  id: number;
  titulo: string;
  descripcion: string;
  vacanteId: number;
  vacanteNombre?: string;
  nivelDificultad?: string;
  tiempoLimiteMinutos?: number;
  tecnologias?: string;
  fechaCreacion: string;
  fechaCierre?: string;
  completada: boolean;
  generadaPorIA: boolean;
  preguntasCount: number;
  candidatosAsignados?: number;
  candidatosCompletados?: number;
}

// Respuesta detallada de prueba técnica
export interface PruebaTecnicaDetalleResponse extends PruebaTecnicaResumenResponse {
  instrucciones?: string;
  reclutador: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  vacante: {
    id: number;
    titulo: string;
  };
  preguntas: PreguntaResponse[];
}

// Respuesta de pregunta
export interface PreguntaResponse {
  id: number;
  enunciado: string;
  tipoPregunta: string;
  puntuacion: number;
  opciones?: string[];
  orden: number;
}

// Solicitud para responder una prueba
export interface EnvioRespuestasPruebaTecnicaRequest {
  candidatoId: number;
  pruebaTecnicaId: number;
  respuestas: RespuestaPreguntaRequest[];
}

// Solicitud de respuesta a pregunta
export interface RespuestaPreguntaRequest {
  preguntaId: number;
  respuesta: string;
}

// Resultados de evaluación
export interface ResultadoPruebaTecnicaResponse {
  id: number;
  candidatoId: number;
  pruebaTecnicaId: number;
  puntuacionTotal: number;
  porcentajeAprobacion: number;
  aprobada: boolean;
  comentarios?: string;
  fechaEvaluacion: string;
  feedbackIA?: string;
  evaluacionesPregunta: EvaluacionPreguntaResponse[];
}

// Evaluación de pregunta
export interface EvaluacionPreguntaResponse {
  preguntaId: number;
  enunciado: string;
  respuesta: string;
  puntuacionObtenida: number;
  puntuacionMaxima: number;
  comentario?: string;
} 