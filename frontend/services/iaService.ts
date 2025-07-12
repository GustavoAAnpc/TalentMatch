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
      
      const respuesta = await fetch(`${API_URL}/ia/generar-descripcion-vacante/${vacanteId}?reclutadorId=${authService.getUsuario()?.id || 0}`, {
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

      return await respuesta.text(); // Cambiado a text() ya que la respuesta es un string
    } catch (error) {
      console.error(`Error en generarDescripcionVacante(${vacanteId}):`, error);
      throw error;
    }
  },
  
  // Generar una descripción de vacante basada en parámetros (sin ID)
  generarDescripcionVacanteParametrizada: async (parametros: {
    titulo: string;
    habilidades?: string;
    requisitos?: string;
    beneficios?: string;
    experiencia?: number;
    ubicacion?: string;
    tipoContrato?: string;
  }) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/generar-descripcion-parametrizada`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: parametros.titulo,
          habilidadesRequeridas: parametros.habilidades || "",
          requisitosAdicionales: parametros.requisitos || "",
          beneficios: parametros.beneficios || "",
          experienciaMinima: parametros.experiencia || 0,
          ubicacion: parametros.ubicacion || "No especificada",
          tipoContrato: parametros.tipoContrato || "No especificado"
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar descripción paramétrica');
      }

      return await respuesta.text();
    } catch (error) {
      console.error('Error en generarDescripcionVacanteParametrizada:', error);
      throw error;
    }
  },

  // Generar contenido completo para una vacante (descripción, requisitos, beneficios y habilidades)
  generarContenidoVacanteCompleto: async (parametros: {
    titulo: string;
    habilidadesExistentes?: string;
    requisitosExistentes?: string;
    beneficiosExistentes?: string;
    experiencia?: number;
    ubicacion?: string;
    tipoContrato?: string;
    area?: string;
    modalidad?: string;
  }) => {
    try {
      const token = authService.getToken();
      
      // Enviar directamente los parámetros al backend sin construir un prompt en el frontend
      const respuesta = await fetch(`${API_URL}/ia/generar-contenido-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: parametros.titulo,
          habilidadesRequeridas: parametros.habilidadesExistentes || "",
          requisitosAdicionales: parametros.requisitosExistentes || "",
          beneficios: parametros.beneficiosExistentes || "",
          experienciaMinima: parametros.experiencia || 0,
          ubicacion: parametros.ubicacion || "No especificada",
          tipoContrato: parametros.tipoContrato || "No especificado",
          area: parametros.area || "No especificada",
          modalidad: parametros.modalidad || "No especificada"
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar contenido completo para la vacante');
      }

      const textoRespuesta = await respuesta.text();
      
      // Depuración
      console.log("Respuesta cruda del backend:", textoRespuesta);
      
      try {
        // Intentar parsear la respuesta como JSON
        const contenidoJSON = JSON.parse(textoRespuesta);
        
        // Si llegamos aquí, la respuesta es un JSON válido
        console.log("Contenido JSON procesado:", contenidoJSON);
        
        // Extraer contenido del JSON
        return {
          descripcion: contenidoJSON.descripcion || "",
          requisitos: contenidoJSON.requisitos || "",
          beneficios: contenidoJSON.beneficios || "",
          habilidades: Array.isArray(contenidoJSON.habilidades) ? contenidoJSON.habilidades : []
        };
      } catch (jsonError) {
        console.error("Error al parsear JSON:", jsonError);
        
        // Si la respuesta no es un JSON válido, usar el método anterior como fallback
        // Función para limpiar texto de caracteres markdown y especiales
        const limpiarTexto = (texto: string): string => {
          if (!texto) return "";
          
          // Eliminar asteriscos (negritas e itálicas)
          let textoLimpio = texto.replace(/\*\*([^*]+)\*\*/g, '$1'); // Eliminar **negrita**
          textoLimpio = textoLimpio.replace(/\*([^*]+)\*/g, '$1');   // Eliminar *itálica*
          textoLimpio = textoLimpio.replace(/\_\_([^_]+)\_\_/g, '$1'); // Eliminar __negrita__
          textoLimpio = textoLimpio.replace(/\_([^_]+)\_/g, '$1');   // Eliminar _itálica_
          
          // Eliminar caracteres de encabezados markdown
          textoLimpio = textoLimpio.replace(/^#+\s+/gm, '');
          
          // Eliminar backticks de código
          textoLimpio = textoLimpio.replace(/`([^`]+)`/g, '$1');
          
          // Mejorar viñetas: reemplazar * - + por guiones simples
          textoLimpio = textoLimpio.replace(/^\s*[\*\+]\s+/gm, '- ');
          
          // Eliminar URL markdown
          textoLimpio = textoLimpio.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
          
          // Otros caracteres especiales
          textoLimpio = textoLimpio.replace(/["""]/g, '"');
          textoLimpio = textoLimpio.replace(/['']/g, "'");
          
          return textoLimpio.trim();
        };
        
        // Parsear la respuesta para extraer cada sección
        const secciones = {
          descripcion: "",
          requisitos: "",
          beneficios: "",
          habilidades: [] as string[]
        };
        
        // Función para extraer contenido de una sección con manejo robusto
        const extraerSeccion = (texto: string, seccion: string): string => {
          // Intentar diferentes formatos de encabezado de sección
          const patrones = [
            new RegExp(`\\[${seccion}\\](.*?)(?=\\[[A-Z]+\\]|$)`, 'is'), // [SECCION]
            new RegExp(`## ${seccion}\\s*(.*?)(?=##\\s+|$)`, 'is'),      // ## Seccion
            new RegExp(`\\*\\*${seccion}\\*\\*\\s*(.*?)(?=\\*\\*|$)`, 'is') // **Seccion**
          ];
          
          // Intentar cada patrón hasta encontrar una coincidencia
          for (const patron of patrones) {
            const coincidencia = texto.match(patron);
            if (coincidencia && coincidencia[1]) {
              return limpiarTexto(coincidencia[1]);
            }
          }
          
          return "";
        };
        
        // Extraer cada sección del texto
        secciones.descripcion = extraerSeccion(textoRespuesta, "DESCRIPCION");
        secciones.requisitos = extraerSeccion(textoRespuesta, "REQUISITOS");
        secciones.beneficios = extraerSeccion(textoRespuesta, "BENEFICIOS");
        
        // Extraer habilidades (formato diferente)
        const seccionHabilidades = extraerSeccion(textoRespuesta, "HABILIDADES");
        if (seccionHabilidades) {
          // Dividir por comas o guiones
          secciones.habilidades = seccionHabilidades
            .split(/[,\n]/)
            .map(h => h.trim())
            .filter(h => h.length > 0 && h !== '-')
            .map(h => h.startsWith('- ') ? h.substring(2) : h);
        }
        
        // Depuración del resultado procesado
        console.log("Contenido procesado de modo tradicional:", secciones);
        
        return secciones;
      }
    } catch (error) {
      console.error('Error en generarContenidoVacanteCompleto:', error);
      throw error;
    }
  },

  // Calcular múltiples emparejamientos para un candidato
  calcularEmparejamientosCandidato: async (candidatoId: number, limite: number = 10) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/emparejamientos-candidato/${candidatoId}?limite=${limite}`, {
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
      
      const respuesta = await fetch(`${API_URL}/ia/analizar-candidatos-postulados/${vacanteId}`, {
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
  },
  
  // Generar una pregunta con IA para pruebas técnicas
  generarPreguntaIA: async (tipoPregunta: string, nivelDificultad?: string) => {
    try {
      const token = authService.getToken();
      
      // Construir los parámetros de la URL
      const params = new URLSearchParams();
      params.append('tipoPregunta', tipoPregunta);
      
      // Añadir el nivel de dificultad si está presente
      if (nivelDificultad) {
        params.append('nivelDificultad', nivelDificultad);
      }
      
      const respuesta = await fetch(`${API_URL}/ia/generar-pregunta?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar pregunta con IA');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en generarPreguntaIA(${tipoPregunta}):`, error);
      throw error;
    }
  },

  // Analizar el perfil de un candidato y generar recomendaciones
  analizarPerfilCandidato: async (candidatoId: number, detalles?: { 
    incluirHabilidades?: boolean, 
    incluirExperiencia?: boolean,
    incluirFormacion?: boolean,
    incluirProyectos?: boolean
  }) => {
    try {
      const token = authService.getToken();
      
      const params = new URLSearchParams();
      if (detalles) {
        if (detalles.incluirHabilidades !== undefined) params.append('incluirHabilidades', detalles.incluirHabilidades.toString());
        if (detalles.incluirExperiencia !== undefined) params.append('incluirExperiencia', detalles.incluirExperiencia.toString());
        if (detalles.incluirFormacion !== undefined) params.append('incluirFormacion', detalles.incluirFormacion.toString());
        if (detalles.incluirProyectos !== undefined) params.append('incluirProyectos', detalles.incluirProyectos.toString());
      }
      
      const url = `${API_URL}/ia/analizar-perfil/${candidatoId}${params.toString() ? '?' + params.toString() : ''}`;
      
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al analizar perfil del candidato');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en analizarPerfilCandidato(${candidatoId}):`, error);
      throw error;
    }
  },
  
  // Generar análisis de mercado para un área específica
  generarAnalisisMercado: async (area: string, ubicacion?: string) => {
    try {
      const token = authService.getToken();
      
      const params = new URLSearchParams();
      params.append('area', area);
      if (ubicacion) params.append('ubicacion', ubicacion);
      
      const respuesta = await fetch(`${API_URL}/ia/analisis-mercado?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar análisis de mercado');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en generarAnalisisMercado(${area}):`, error);
      throw error;
    }
  },
  
  // Sugerir mejoras para el perfil de un candidato
  sugerirMejorasPerfil: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/ia/sugerir-mejoras-perfil/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al sugerir mejoras para el perfil');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en sugerirMejorasPerfil(${candidatoId}):`, error);
      throw error;
    }
  }
}; 