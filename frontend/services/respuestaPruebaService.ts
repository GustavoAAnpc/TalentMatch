"use client";

import { authService } from './authService';
import { EnvioRespuestasPruebaTecnicaRequest, ResultadoPruebaTecnicaResponse } from '@/types/pruebaTecnica';

// Usar variable de entorno o valor predeterminado
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const respuestaPruebaService = {
  // Enviar respuestas de una prueba técnica
  enviarRespuestas: async (datos: EnvioRespuestasPruebaTecnicaRequest) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/respuestas/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al enviar respuestas de la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en enviarRespuestas:', error);
      throw error;
    }
  },

  // Responder a una pregunta individual
  responderPregunta: async (pruebaTecnicaId: number, preguntaId: number, candidatoId: number, contenidoRespuesta: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaTecnicaId}/preguntas/${preguntaId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidatoId: candidatoId,
          contenido: contenidoRespuesta
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al responder la pregunta');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en responderPregunta(${pruebaTecnicaId}, ${preguntaId}):`, error);
      throw error;
    }
  },

  // Marcar una prueba técnica como completada
  completarPrueba: async (pruebaTecnicaId: number, candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaTecnicaId}/completar?candidatoId=${candidatoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al completar la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en completarPrueba(${pruebaTecnicaId}, ${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener resultado de una prueba técnica
  obtenerResultado: async (pruebaTecnicaId: number, candidatoId: number): Promise<ResultadoPruebaTecnicaResponse> => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaTecnicaId}/resultado?candidatoId=${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener el resultado de la prueba');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerResultado(${pruebaTecnicaId}, ${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener todas las pruebas técnicas asignadas a un candidato
  obtenerPruebasPorCandidato: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/candidato/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las pruebas del candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebasPorCandidato(${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener pruebas técnicas pendientes de un candidato
  obtenerPruebasPendientesPorCandidato: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/candidato/${candidatoId}/pendientes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las pruebas pendientes');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebasPendientesPorCandidato(${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener pruebas técnicas completadas de un candidato
  obtenerPruebasCompletadasPorCandidato: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/candidato/${candidatoId}/completadas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las pruebas completadas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebasCompletadasPorCandidato(${candidatoId}):`, error);
      throw error;
    }
  }
}; 