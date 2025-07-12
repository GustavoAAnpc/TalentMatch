import { authService } from './authService';

const API_URL = 'http://localhost:8080/api';

export const iaService = {
  // Calcular el emparejamiento entre un candidato y una vacante
  calcularEmparejamiento: async (candidatoId: number, vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/emparejamiento?candidatoId=${candidatoId}&vacanteId=${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al calcular emparejamiento');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en calcularEmparejamiento(${candidatoId}, ${vacanteId}):`, error);
      throw error;
    }
  },

  // Recomendar vacantes para un candidato
  recomendarVacantes: async (candidatoId: number, limite: number = 5) => {
    try {
      const token = authService.getToken();
      
      // Verificar si hay token disponible
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }
      
      // Usar la ruta correcta del backend
      const respuesta = await fetch(`${API_URL}/ia/candidatos/${candidatoId}/vacantes-recomendadas?limite=${limite}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        // Intentar obtener el mensaje de error del servidor
        try {
        const errorData = await respuesta.json();
          throw new Error(errorData.mensaje || `Error al recomendar vacantes: ${respuesta.status}`);
        } catch (parseError) {
          // Si no se puede parsear la respuesta, usar un mensaje genérico con el código de estado
          throw new Error(`Error al recomendar vacantes. Código: ${respuesta.status}`);
        }
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en recomendarVacantes(${candidatoId}):`, error);
      // Devolver un array vacío en lugar de propagar el error
      return [];
    }
  },

  // Recomendar candidatos para una vacante
  recomendarCandidatos: async (vacanteId: number, limite: number = 5) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/recomendar-candidatos?vacanteId=${vacanteId}&limite=${limite}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al recomendar candidatos');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en recomendarCandidatos(${vacanteId}):`, error);
      throw error;
    }
  },

  // Generar una descripción optimizada para una vacante
  generarDescripcionVacante: async (vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/generar-descripcion-vacante?vacanteId=${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar descripción de vacante');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en generarDescripcionVacante(${vacanteId}):`, error);
      throw error;
    }
  },

  // Calcular múltiples emparejamientos para un candidato
  calcularEmparejamientosCandidato: async (candidatoId: number, limite: number = 5) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/emparejamientos-candidato?candidatoId=${candidatoId}&limite=${limite}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al calcular emparejamientos del candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en calcularEmparejamientosCandidato(${candidatoId}):`, error);
      throw error;
    }
  },

  // Analizar candidatos postulados a una vacante
  analizarCandidatosPostulados: async (vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/analizar-candidatos-postulados?vacanteId=${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al analizar candidatos postulados');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en analizarCandidatosPostulados(${vacanteId}):`, error);
      throw error;
    }
  },

  // Generar retroalimentación personalizada para un candidato
  generarRetroalimentacion: async (postulacionId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/retroalimentacion?postulacionId=${postulacionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar retroalimentación');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en generarRetroalimentacion(${postulacionId}):`, error);
      throw error;
    }
  }
}; 