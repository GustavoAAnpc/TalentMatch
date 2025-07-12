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
      
      // Asegurar que experienciaRequerida esté presente
      if (!datosProcesados.experienciaRequerida && datosProcesados.experienciaMinima !== undefined) {
        datosProcesados.experienciaRequerida = `${datosProcesados.experienciaMinima} años`;
      }
      
      // Asegurar que las fechas estén en formato YYYY-MM-DD para LocalDate en el backend
      if (datosProcesados.fechaPublicacion) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaPublicacion === 'string') {
          datosProcesados.fechaPublicacion = datosProcesados.fechaPublicacion.split('T')[0];
        }
      } else {
        // Si no hay fecha de publicación, usar la fecha actual
        datosProcesados.fechaPublicacion = new Date().toISOString().split('T')[0];
      }
      
      if (datosProcesados.fechaCierre) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaCierre === 'string') {
          datosProcesados.fechaCierre = datosProcesados.fechaCierre.split('T')[0];
        }
        
        // Verificar que la fecha de cierre sea posterior a la de publicación
        const fechaPublicacion = new Date(datosProcesados.fechaPublicacion);
        const fechaCierre = new Date(datosProcesados.fechaCierre);
        
        if (fechaCierre <= fechaPublicacion) {
          throw new Error("La fecha de cierre debe ser posterior a la fecha de publicación");
        }
      }
      
      // Asegurar que todos los campos booleanos sean realmente booleanos
      if (datosProcesados.mostrarSalario !== undefined) {
        datosProcesados.mostrarSalario = Boolean(datosProcesados.mostrarSalario);
      }
      
      if (datosProcesados.destacada !== undefined) {
        datosProcesados.destacada = Boolean(datosProcesados.destacada);
      }
      
      // Asegurar que las cadenas de texto no sean undefined
      Object.keys(datosProcesados).forEach(key => {
        const value = datosProcesados[key];
        if (value === undefined && typeof datosVacante[key] === 'string') {
          datosProcesados[key] = "";
        }
      });
      
      console.log('Datos procesados a enviar:', JSON.stringify(datosProcesados, null, 2));
      
      // URL de la petición
      const url = `${API_URL}/vacantes?reclutadorId=${reclutadorId}`;
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosProcesados)
      };
      
      const response = await fetch(url, requestOptions);
      
      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        let errorMessage = 'Error al crear la vacante';
        
        // Verificar si hay cuerpo en la respuesta
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            
            // Extraer el mensaje de error del objeto de respuesta
            if (errorData.mensaje) {
              errorMessage = errorData.mensaje;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.errors && errorData.errors.length > 0) {
              // En caso de errores de validación
              errorMessage = errorData.errors.map((err: any) => err.defaultMessage || err.message).join(", ");
            }
          } else {
            // Si no es JSON, obtener el texto de la respuesta
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error al parsear la respuesta de error:', parseError);
          errorMessage = `Error al procesar la respuesta del servidor: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData;
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
      
      // Verificar que el token exista
      if (!token) {
        console.error('Error: No se encontró token de autenticación');
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
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
      
      // Asegurar que experienciaRequerida esté presente
      if (!datosProcesados.experienciaRequerida && datosProcesados.experienciaMinima !== undefined) {
        datosProcesados.experienciaRequerida = `${datosProcesados.experienciaMinima} años`;
      }
      
      // Asegurar que las fechas estén en formato YYYY-MM-DD para LocalDate en el backend
      if (datosProcesados.fechaPublicacion) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaPublicacion === 'string') {
          datosProcesados.fechaPublicacion = datosProcesados.fechaPublicacion.split('T')[0];
        }
      } else {
        // Si no hay fecha de publicación, usar la fecha actual
        datosProcesados.fechaPublicacion = new Date().toISOString().split('T')[0];
      }
      
      if (datosProcesados.fechaCierre) {
        // Si la fecha tiene formato datetime, extraer solo la parte de fecha
        if (typeof datosProcesados.fechaCierre === 'string') {
          datosProcesados.fechaCierre = datosProcesados.fechaCierre.split('T')[0];
        }
        
        // Verificar que la fecha de cierre sea posterior a la de publicación
        const fechaPublicacion = new Date(datosProcesados.fechaPublicacion);
        const fechaCierre = new Date(datosProcesados.fechaCierre);
        
        if (fechaCierre <= fechaPublicacion) {
          throw new Error("La fecha de cierre debe ser posterior a la fecha de publicación");
        }
      }
      
      // Asegurar que todos los campos booleanos sean realmente booleanos
      if (datosProcesados.mostrarSalario !== undefined) {
        datosProcesados.mostrarSalario = Boolean(datosProcesados.mostrarSalario);
      }
      
      if (datosProcesados.destacada !== undefined) {
        datosProcesados.destacada = Boolean(datosProcesados.destacada);
      }
      
      // Validación de longitud de campos
      if (datosProcesados.titulo && datosProcesados.titulo.length > 100) {
        datosProcesados.titulo = datosProcesados.titulo.substring(0, 100);
      }
      
      if (datosProcesados.descripcion && datosProcesados.descripcion.length > 4000) {
        datosProcesados.descripcion = datosProcesados.descripcion.substring(0, 4000);
      }
      
      if (datosProcesados.habilidadesRequeridas && datosProcesados.habilidadesRequeridas.length > 500) {
        datosProcesados.habilidadesRequeridas = datosProcesados.habilidadesRequeridas.substring(0, 500);
      }
      
      if (datosProcesados.requisitosAdicionales && datosProcesados.requisitosAdicionales.length > 2000) {
        datosProcesados.requisitosAdicionales = datosProcesados.requisitosAdicionales.substring(0, 2000);
      }
      
      if (datosProcesados.beneficios && datosProcesados.beneficios.length > 2000) {
        datosProcesados.beneficios = datosProcesados.beneficios.substring(0, 2000);
      }
      
      const url = `${API_URL}/vacantes/${id}?reclutadorId=${reclutadorId}`;
      
      const requestOptions = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosProcesados)
      };
      
      const respuesta = await fetch(url, requestOptions);

      if (!respuesta.ok) {
        let errorMessage = 'Error al actualizar la vacante';
        
        // Verificar si hay cuerpo en la respuesta
        const contentType = respuesta.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await respuesta.json();
            
            // Extraer el mensaje de error del objeto de respuesta
            if (errorData.mensaje) {
              errorMessage = errorData.mensaje;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.errors && errorData.errors.length > 0) {
              // En caso de errores de validación
              errorMessage = errorData.errors.map((err: any) => err.defaultMessage || err.message).join(", ");
            }
          } else {
            // Si no es JSON, obtener el texto de la respuesta
            const errorText = await respuesta.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error al parsear la respuesta de error:', parseError);
          errorMessage = `Error al procesar la respuesta del servidor: ${respuesta.status} ${respuesta.statusText}`;
        }
        
        throw new Error(errorMessage);
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
        method: 'PUT',
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
  },

  // Verificar si una vacante tiene pruebas técnicas asociadas
  verificarPruebasTecnicas: async (id: number) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
      const respuesta = await fetch(`${API_URL}/vacantes/${id}/tiene-pruebas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al verificar pruebas técnicas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en verificarPruebasTecnicas(${id}):`, error);
      throw error;
    }
  },
  
  // Eliminar una vacante
  eliminarVacante: async (id: number, reclutadorId: number, eliminarPruebaTecnica: boolean = false) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
      const respuesta = await fetch(`${API_URL}/vacantes/${id}?reclutadorId=${reclutadorId}&eliminarPruebaTecnica=${eliminarPruebaTecnica}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        let errorMessage = 'Error al eliminar la vacante';
        
        try {
          const contentType = respuesta.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await respuesta.json();
            errorMessage = errorData.mensaje || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Error al parsear la respuesta de error:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarVacante(${id}):`, error);
      throw error;
    }
  }
}; 