import { authService } from './authService';

const API_URL = 'http://localhost:8080/api';

export const vacanteService = {
  // Crear una nueva vacante
  crearVacante: async (reclutadorId: number, datosVacante: any) => {
    try {
      const token = authService.getToken();
      
      // Verificar que el token exista
      if (!token) {
        console.error('Error: No se encontró token de autenticación');
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
      console.log('Intentando crear vacante con reclutadorId:', reclutadorId);
      console.log('Token de autenticación presente:', !!token);
      
      // Clonar el objeto para no modificar el original
      const datosProcesados = { ...datosVacante };
      
      // Asegurar que los valores numéricos sean números y no strings
      if (datosProcesados.salarioMinimo !== undefined) {
        datosProcesados.salarioMinimo = Number(datosProcesados.salarioMinimo) || 0;
      }
      
      if (datosProcesados.salarioMaximo !== undefined) {
        datosProcesados.salarioMaximo = Number(datosProcesados.salarioMaximo) || 0;
      }
      
      if (datosProcesados.experienciaMinima !== undefined) {
        datosProcesados.experienciaMinima = Number(datosProcesados.experienciaMinima) || 0;
      }
      
      // Asegurar que las fechas estén en formato YYYY-MM-DD para LocalDate en el backend
      if (datosProcesados.fechaPublicacion) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaPublicacion === 'string') {
          datosProcesados.fechaPublicacion = datosProcesados.fechaPublicacion.split('T')[0];
        }
      }
      
      if (datosProcesados.fechaCierre) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaCierre === 'string') {
          datosProcesados.fechaCierre = datosProcesados.fechaCierre.split('T')[0];
        }
      }
      
      // Asegurar que todos los campos booleanos sean realmente booleanos
      if (datosProcesados.mostrarSalario !== undefined) {
        datosProcesados.mostrarSalario = Boolean(datosProcesados.mostrarSalario);
      }
      
      if (datosProcesados.destacada !== undefined) {
        datosProcesados.destacada = Boolean(datosProcesados.destacada);
      }
      
      console.log('Datos procesados a enviar:', JSON.stringify(datosProcesados, null, 2));
      
      const response = await fetch(`${API_URL}/vacantes?reclutadorId=${reclutadorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosProcesados)
      });
      
      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al crear vacante:', errorData);
        throw new Error(errorData.mensaje || 'Error al crear la vacante');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en servicio crearVacante:', error);
      throw error;
    }
  },

  // Obtener todas las vacantes con paginación opcional
  obtenerVacantes: async (pagina = 0, tamaño = 10, estado?: string) => {
    try {
      let url = `${API_URL}/vacantes?page=${pagina}&size=${tamaño}`;
      
      if (estado) {
        url += `&estado=${estado}`;
      }
      
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const respuesta = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las vacantes');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en obtenerVacantes:', error);
      throw error;
    }
  },

  // Obtener una vacante por su ID
  obtenerVacantePorId: async (id: number) => {
    try {
      const token = authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const respuesta = await fetch(`${API_URL}/vacantes/${id}`, {
        method: 'GET',
        headers
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener la vacante');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerVacantePorId(${id}):`, error);
      throw error;
    }
  },

  // Obtener vacantes de un reclutador específico
  obtenerVacantesReclutador: async (reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/vacantes/reclutador/${reclutadorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las vacantes del reclutador');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerVacantesReclutador(${reclutadorId}):`, error);
      throw error;
    }
  },

  // Actualizar una vacante existente
  actualizarVacante: async (id: number, reclutadorId: number, datosVacante: any) => {
    try {
      const token = authService.getToken();
      
      // Formatear fechas para el backend (LocalDateTime requiere formato ISO completo)
      const datosProcesados = {
        ...datosVacante
      };
      
      // Asegurar que los valores numéricos sean números y no strings
      if (typeof datosProcesados.salarioMinimo === 'string') {
        datosProcesados.salarioMinimo = Number(datosProcesados.salarioMinimo) || 0;
      }
      
      if (typeof datosProcesados.salarioMaximo === 'string') {
        datosProcesados.salarioMaximo = Number(datosProcesados.salarioMaximo) || 0;
      }
      
      if (typeof datosProcesados.experienciaMinima === 'string') {
        datosProcesados.experienciaMinima = Number(datosProcesados.experienciaMinima) || 0;
      }
      
      // Convertir fechas de formato YYYY-MM-DD a formato ISO 8601 completo
      if (datosProcesados.fechaPublicacion) {
        // Intentar solución alternativa: enviar solo la fecha sin hora
        datosProcesados.fechaPublicacion = datosProcesados.fechaPublicacion.split('T')[0];
      }
      
      if (datosProcesados.fechaCierre) {
        // Intentar solución alternativa: enviar solo la fecha sin hora
        datosProcesados.fechaCierre = datosProcesados.fechaCierre.split('T')[0];
      }
      
      // Validación de longitud de campos
      if (datosProcesados.titulo && datosProcesados.titulo.length > 100) {
        datosProcesados.titulo = datosProcesados.titulo.substring(0, 100);
      }
      
      if (datosProcesados.descripcion && datosProcesados.descripcion.length > 2000) {
        datosProcesados.descripcion = datosProcesados.descripcion.substring(0, 2000);
      }
      
      if (datosProcesados.habilidadesRequeridas && datosProcesados.habilidadesRequeridas.length > 500) {
        datosProcesados.habilidadesRequeridas = datosProcesados.habilidadesRequeridas.substring(0, 500);
      }
      
      if (datosProcesados.requisitosAdicionales && datosProcesados.requisitosAdicionales.length > 500) {
        datosProcesados.requisitosAdicionales = datosProcesados.requisitosAdicionales.substring(0, 500);
      }
      
      if (datosProcesados.beneficios && datosProcesados.beneficios.length > 500) {
        datosProcesados.beneficios = datosProcesados.beneficios.substring(0, 500);
      }
      
      const datosJSON = JSON.stringify(datosProcesados);
      console.log('Datos procesados a enviar en actualizarVacante:', datosJSON);
      
      const respuesta = await fetch(`${API_URL}/vacantes/${id}?reclutadorId=${reclutadorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: datosJSON
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar la vacante');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarVacante(${id}):`, error);
      throw error;
    }
  },

  // Cambiar el estado de una vacante
  cambiarEstadoVacante: async (id: number, reclutadorId: number, estado: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/vacantes/${id}/estado?reclutadorId=${reclutadorId}&estado=${estado}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al cambiar el estado de la vacante');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en cambiarEstadoVacante(${id}):`, error);
      throw error;
    }
  },

  // Obtener vacantes destacadas.
  obtenerVacantesDestacadas: async () => {
    try {
      // Obtener token de autenticación
      const token = authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const respuesta = await fetch(`${API_URL}/vacantes/destacadas`, {
        method: 'GET',
        headers
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener vacantes destacadas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en obtenerVacantesDestacadas:', error);
      throw error;
    }
  },
  
  // Obtener vacantes activas
  obtenerVacantesActivas: async () => {
    try {
      // Obtener token de autenticación
      const token = authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const respuesta = await fetch(`${API_URL}/vacantes/activas`, {
        method: 'GET',
        headers
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener vacantes activas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en obtenerVacantesActivas:', error);
      throw error;
    }
  },

  // Obtener vacantes públicas (sin autenticación)
  obtenerVacantesPublicas: async () => {
    try {
      const respuesta = await fetch(`${API_URL}/vacantes/publicas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener vacantes públicas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en obtenerVacantesPublicas:', error);
      throw error;
    }
  }
}; 