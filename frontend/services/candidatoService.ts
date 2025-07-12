import { authService } from './authService';

const API_URL = 'http://localhost:8080/api';

export const candidatoService = {
  // Subir CV del candidato
  subirCurriculum: async (candidatoId: number, archivoCv: File) => {
    try {
      const token = authService.getToken();
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', archivoCv);
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/curriculum`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al subir el currículum');
      }

      // Verificar el tipo de contenido de la respuesta
      const contentType = respuesta.headers.get('content-type');
      
      // Si es texto o no es JSON explícito, manejar como texto
      if (!contentType || !contentType.includes('application/json')) {
        return await respuesta.text(); // Devolver como texto en lugar de JSON
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en subirCurriculum(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Obtener perfil del candidato
  obtenerPerfilCandidato: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener el perfil del candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPerfilCandidato(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Actualizar perfil del candidato
  actualizarPerfilCandidato: async (candidatoId: number, datos: any) => {
    try {
      const token = authService.getToken();
      
      // Eliminar propiedades que son null o undefined
      const datosLimpios = Object.entries(datos)
        .filter(([_, value]) => value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});
      
      console.log('Datos a enviar:', datosLimpios);
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosLimpios)
      });

      if (!respuesta.ok) {
        let mensaje = 'Error al actualizar el perfil del candidato';
        try {
          const errorData = await respuesta.json();
          mensaje = errorData.mensaje || mensaje;
        } catch (e) {
          console.error('Error al procesar respuesta de error:', e);
        }
        throw new Error(mensaje);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarPerfilCandidato(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Analizar CV con IA
  analizarCurriculumConIA: async (archivoCv: File) => {
    try {
      const token = authService.getToken();
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', archivoCv);
      
      const respuesta = await fetch(`${API_URL}/ia/analizar-cv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al analizar el currículum con IA');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en analizarCurriculumConIA:', error);
      throw error;
    }
  },
  
  // Solicitar análisis completo del perfil del candidato
  solicitarAnalisisPerfil: async (candidatoId: number, opciones = {
    incluirRecomendaciones: true,
    analizarCV: true,
    analizarHabilidadesTecnicas: true,
    analizarCompatibilidadVacantes: true
  }) => {
    try {
      const token = authService.getToken();
      
      // Verificar si tenemos token de autenticación
      if (!token) {
        console.warn('No hay token de autenticación disponible para solicitar análisis de perfil');
        throw new Error('No autorizado: inicie sesión para continuar');
      }
      
      console.log(`Solicitando análisis de perfil para candidato ID: ${candidatoId}`);
      
      // Crear el objeto de solicitud según el formato esperado por el backend
      const analisisRequest = {
        candidatoId: candidatoId,
        incluirRecomendaciones: opciones.incluirRecomendaciones,
        analizarCV: opciones.analizarCV,
        analizarHabilidadesTecnicas: opciones.analizarHabilidadesTecnicas,
        analizarCompatibilidadVacantes: opciones.analizarCompatibilidadVacantes
      };
      
      const respuesta = await fetch(`${API_URL}/ia/analizar-perfil`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analisisRequest)
      });

      // Verificar respuesta
      if (!respuesta.ok) {
        let mensaje = 'Error al solicitar análisis de perfil';
        
        try {
          const errorData = await respuesta.json();
          mensaje = errorData.mensaje || mensaje;
        } catch (e) {
          console.error('Error al procesar respuesta de error:', e);
        }
        
        if (respuesta.status === 404) {
          throw new Error('Endpoint no encontrado: /ia/analizar-perfil');
        } else if (respuesta.status === 401) {
          throw new Error('No autorizado: inicie sesión para continuar');
        } else {
          throw new Error(mensaje);
        }
      }

      const resultado = await respuesta.json();
      console.log('Análisis de perfil recibido correctamente');
      return resultado;
    } catch (error) {
      console.error(`Error en solicitarAnalisisPerfil(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Obtener vacantes favoritas del candidato
  obtenerVacantasFavoritas: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      // Verificar si hay token disponible
      if (!token) {
        console.warn('No hay token de autenticación disponible para obtener vacantes favoritas');
        return [];
      }
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/vacantes-favoritas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        // Intentar obtener el mensaje de error
        try {
          const errorData = await respuesta.json();
          console.error(`Error al obtener vacantes favoritas: ${errorData.mensaje || respuesta.status}`);
        } catch (parseError) {
          console.error(`Error al obtener vacantes favoritas. Código: ${respuesta.status}`);
        }
        // Devolver array vacío para evitar errores en la interfaz
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerVacantasFavoritas(${candidatoId}):`, error);
      // Devolver array vacío para evitar errores en la interfaz
      return [];
    }
  },
  
  // Agregar vacante a favoritos
  agregarVacanteFavorita: async (candidatoId: number, vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/favoritos/${vacanteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al agregar vacante a favoritos');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarVacanteFavorita(${candidatoId}, ${vacanteId}):`, error);
      throw error;
    }
  },
  
  // Eliminar vacante de favoritos
  eliminarVacanteFavorita: async (candidatoId: number, vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/favoritos/${vacanteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar vacante de favoritos');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarVacanteFavorita(${candidatoId}, ${vacanteId}):`, error);
      throw error;
    }
  },
  
  // Obtener experiencia laboral
  obtenerExperienciaLaboral: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/experiencia`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener experiencias. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerExperienciaLaboral(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Agregar experiencia laboral
  agregarExperienciaLaboral: async (candidatoId: number, experiencia: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/experiencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(experiencia)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al agregar experiencia laboral: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarExperienciaLaboral:`, error);
      throw error;
    }
  },
  
  // Actualizar experiencia laboral
  actualizarExperienciaLaboral: async (candidatoId: number, experienciaId: number, experiencia: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/experiencia/${experienciaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(experiencia)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al actualizar experiencia laboral: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarExperienciaLaboral:`, error);
      throw error;
    }
  },
  
  // Eliminar experiencia laboral
  eliminarExperienciaLaboral: async (candidatoId: number, experienciaId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/experiencia/${experienciaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar experiencia laboral');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarExperienciaLaboral:`, error);
      throw error;
    }
  },
  
  // Obtener educación
  obtenerEducacion: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/educacion`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener educación. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerEducacion(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Agregar educación
  agregarEducacion: async (candidatoId: number, educacion: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/educacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(educacion)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al agregar educación: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarEducacion:`, error);
      throw error;
    }
  },
  
  // Actualizar educación
  actualizarEducacion: async (candidatoId: number, educacionId: number, educacion: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/educacion/${educacionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(educacion)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al actualizar educación: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarEducacion:`, error);
      throw error;
    }
  },
  
  // Eliminar educación
  eliminarEducacion: async (candidatoId: number, educacionId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/educacion/${educacionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar educación');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarEducacion:`, error);
      throw error;
    }
  },
  
  // Obtener habilidades
  obtenerHabilidades: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/habilidades`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener habilidades. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerHabilidades(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Agregar habilidad
  agregarHabilidad: async (candidatoId: number, habilidad: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/habilidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(habilidad)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al agregar habilidad: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarHabilidad:`, error);
      throw error;
    }
  },
  
  // Actualizar habilidad
  actualizarHabilidad: async (candidatoId: number, habilidadId: number, habilidad: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/habilidades/${habilidadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(habilidad)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al actualizar habilidad: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarHabilidad:`, error);
      throw error;
    }
  },
  
  // Eliminar habilidad
  eliminarHabilidad: async (candidatoId: number, habilidadId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/habilidades/${habilidadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar habilidad');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarHabilidad:`, error);
      throw error;
    }
  },
  
  // Obtener certificaciones
  obtenerCertificaciones: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/certificaciones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener certificaciones. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerCertificaciones(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Agregar certificación
  agregarCertificacion: async (candidatoId: number, certificacion: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/certificaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(certificacion)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al agregar certificación: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarCertificacion:`, error);
      throw error;
    }
  },
  
  // Actualizar certificación
  actualizarCertificacion: async (candidatoId: number, certificacionId: number, certificacion: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/certificaciones/${certificacionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(certificacion)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al actualizar certificación: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarCertificacion:`, error);
      throw error;
    }
  },
  
  // Eliminar certificación
  eliminarCertificacion: async (candidatoId: number, certificacionId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/certificaciones/${certificacionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Error al eliminar certificación: ${respuesta.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarCertificacion:`, error);
      throw error;
    }
  },
  
  // Obtener idiomas
  obtenerIdiomas: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/idiomas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener idiomas. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerIdiomas(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Agregar idioma
  agregarIdioma: async (candidatoId: number, idioma: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/idiomas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(idioma)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al agregar idioma: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en agregarIdioma:`, error);
      throw error;
    }
  },
  
  // Actualizar idioma
  actualizarIdioma: async (candidatoId: number, idiomaId: number, idioma: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/idiomas/${idiomaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(idioma)
      });

      if (!respuesta.ok) {
        throw new Error(`Error al actualizar idioma: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarIdioma:`, error);
      throw error;
    }
  },
  
  // Eliminar idioma
  eliminarIdioma: async (candidatoId: number, idiomaId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/idiomas/${idiomaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar idioma');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarIdioma:`, error);
      throw error;
    }
  },
  
  // Obtener URL firmada temporal para visualizar el CV
  obtenerUrlFirmadaCV: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/curriculum/view`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Error al obtener URL firmada del CV: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerUrlFirmadaCV:`, error);
      throw error;
    }
  },
  
  // Actualizar foto de perfil
  actualizarFotoPerfil: async (candidatoId: number, archivo: File) => {
    try {
      const token = authService.getToken();
      
      // Verificar tipo de archivo
      const tiposValidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!tiposValidos.includes(archivo.type)) {
        throw new Error('Formato de imagen no válido. Por favor, sube una imagen en formato JPEG, PNG, WEBP o GIF.');
      }
      
      // Verificar tamaño del archivo (máximo 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
      }
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', archivo);
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/foto-perfil`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!respuesta.ok) {
        let mensaje = 'Error al actualizar la foto de perfil';
        try {
          const errorData = await respuesta.json();
          mensaje = errorData.mensaje || mensaje;
        } catch (e) {
          console.error('Error al procesar respuesta de error:', e);
        }
        throw new Error(mensaje);
      }

      return await respuesta.text();
    } catch (error) {
      console.error(`Error en actualizarFotoPerfil(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Eliminar foto de perfil
  eliminarFotoPerfil: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/foto-perfil`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        let mensaje = 'Error al eliminar la foto de perfil';
        try {
          const errorData = await respuesta.json();
          mensaje = errorData.mensaje || mensaje;
        } catch (e) {
          console.error('Error al procesar respuesta de error:', e);
        }
        throw new Error(mensaje);
      }

      return await respuesta.text();
    } catch (error) {
      console.error(`Error en eliminarFotoPerfil(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Filtrar candidatos con criterios avanzados
  filtrarCandidatos: async (filtros: {
    tituloProfesional?: string;
    nombre?: string;
    habilidad?: string;
    experienciaMinima?: number;
    ubicacion?: string;
    disponibilidadInmediata?: boolean;
    pagina?: number;
    tamanio?: number;
    ordenarPor?: string;
    direccion?: string;
  }) => {
    try {
      const token = authService.getToken();
      
      // Construir los parámetros de consulta
      const params = new URLSearchParams();
      
      if (filtros.tituloProfesional) {
        params.append('tituloProfesional', filtros.tituloProfesional);
      }
      
      if (filtros.nombre) {
        params.append('nombre', filtros.nombre);
      }
      
      if (filtros.habilidad) {
        params.append('habilidad', filtros.habilidad);
      }
      
      if (filtros.experienciaMinima !== undefined) {
        params.append('experienciaMinima', filtros.experienciaMinima.toString());
      }
      
      if (filtros.ubicacion) {
        params.append('ubicacion', filtros.ubicacion);
      }
      
      if (filtros.disponibilidadInmediata !== undefined) {
        params.append('disponibilidadInmediata', filtros.disponibilidadInmediata.toString());
      }
      
      // Parámetros de paginación y ordenamiento
      params.append('pagina', (filtros.pagina || 0).toString());
      params.append('tamanio', (filtros.tamanio || 10).toString());
      params.append('ordenarPor', filtros.ordenarPor || 'id');
      params.append('direccion', filtros.direccion || 'desc');
      
      const respuesta = await fetch(`${API_URL}/candidatos/filtrar?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al filtrar candidatos');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en filtrarCandidatos:', error);
      throw error;
    }
  },
  
  // Obtener todos los candidatos
  obtenerTodosCandidatos: async () => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener candidatos');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en obtenerTodosCandidatos:', error);
      throw error;
    }
  },
  
  // Actualizar estado del candidato
  actualizarEstadoCandidato: async (candidatoId: number, estado: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/candidatos/${candidatoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar el estado del candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarEstadoCandidato(${candidatoId}):`, error);
      throw error;
    }
  }
}; 