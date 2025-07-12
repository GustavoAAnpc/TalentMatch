import { authService } from './authService';

const API_URL = 'http://localhost:8080/api';

export const pruebaTecnicaService = {
  // Crear una nueva prueba técnica manualmente
  crearPruebaTecnica: async (reclutadorId: number, datosPrueba: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas?reclutadorId=${reclutadorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosPrueba)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al crear la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en crearPruebaTecnica:', error);
      throw error;
    }
  },

  // Generar una prueba técnica con IA basada en una vacante
  generarPruebaConIA: async (vacanteId: number, reclutadorId: number, titulo: string, descripcion: string, numPreguntas: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/generar-con-ia?vacanteId=${vacanteId}&reclutadorId=${reclutadorId}&titulo=${encodeURIComponent(titulo)}&descripcion=${encodeURIComponent(descripcion)}&numPreguntas=${numPreguntas}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar la prueba técnica con IA');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en generarPruebaConIA:', error);
      throw error;
    }
  },

  // Obtener preguntas generadas por IA para una vacante (sin crear la prueba)
  generarPreguntasConIA: async (vacanteId: number, reclutadorId: number, numPreguntas: number = 5) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/generar-preguntas?vacanteId=${vacanteId}&reclutadorId=${reclutadorId}&numPreguntas=${numPreguntas}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar preguntas con IA');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en generarPreguntasConIA:', error);
      throw error;
    }
  },

  // Obtener pruebas técnicas de un reclutador
  obtenerPruebasPorReclutador: async (reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/reclutador/${reclutadorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las pruebas del reclutador');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebasPorReclutador(${reclutadorId}):`, error);
      throw error;
    }
  },

  // Obtener pruebas técnicas por vacante
  obtenerPruebasPorVacante: async (vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/vacante/${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las pruebas de la vacante');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebasPorVacante(${vacanteId}):`, error);
      throw error;
    }
  },
  
  // Obtener detalle de una prueba técnica
  obtenerPruebaPorId: async (id: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPruebaPorId(${id}):`, error);
      throw error;
    }
  },
  
  // Asignar prueba técnica a un candidato
  asignarPruebaACandidato: async (pruebaId: number, candidatoId: number, reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaId}/asignar?candidatoId=${candidatoId}&reclutadorId=${reclutadorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al asignar la prueba al candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en asignarPruebaACandidato(${pruebaId}, ${candidatoId}):`, error);
      throw error;
    }
  }
}; 