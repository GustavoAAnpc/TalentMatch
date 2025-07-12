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

  // Actualizar una prueba técnica existente
  actualizarPruebaTecnica: async (pruebaId: number, reclutadorId: number, datosPrueba: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaId}?reclutadorId=${reclutadorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosPrueba)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        console.error('Respuesta del servidor:', errorData);
        // Proporcionar un mensaje más descriptivo basado en la respuesta del servidor
        if (errorData.errors && Object.keys(errorData.errors).length > 0) {
          const errores = Object.entries(errorData.errors)
            .map(([campo, mensaje]) => `${campo}: ${mensaje}`)
            .join(', ');
          throw new Error(`Se encontraron errores de validación: ${errores}`);
        }
        throw new Error(errorData.mensaje || 'Error al actualizar la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarPruebaTecnica(${pruebaId}):`, error);
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

  // Generar una prueba técnica con IA basada solo en título y descripción (sin vacante)
  generarPruebaConIAPorTitulo: async (reclutadorId: number, titulo: string, descripcion: string, tecnologias: string, numPreguntas: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/generar-con-ia-por-titulo?reclutadorId=${reclutadorId}&titulo=${encodeURIComponent(titulo)}&descripcion=${encodeURIComponent(descripcion)}&tecnologias=${encodeURIComponent(tecnologias)}&numPreguntas=${numPreguntas}`, {
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
      console.error('Error en generarPruebaConIAPorTitulo:', error);
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

  // Generar descripción y tecnologías con IA para una prueba técnica
  generarDescripcionYTecnologias: async (vacanteId: number, reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/generar-descripcion-tecnologias?vacanteId=${vacanteId}&reclutadorId=${reclutadorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar descripción y tecnologías con IA');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en generarDescripcionYTecnologias:', error);
      throw error;
    }
  },

  // Generar descripción y tecnologías con IA para una prueba técnica basada solo en el título
  generarDescripcionYTecnologiasPorTitulo: async (tituloPrueba: string, reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/generar-descripcion-tecnologias-por-titulo?tituloPrueba=${encodeURIComponent(tituloPrueba)}&reclutadorId=${reclutadorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al generar descripción y tecnologías con IA basadas en el título');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en generarDescripcionYTecnologiasPorTitulo:', error);
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
      console.log(`Iniciando solicitud para obtener pruebas técnicas de la vacante ID: ${vacanteId}`);
      const token = authService.getToken();
      
      if (!token) {
        console.error("No se encontró token de autenticación");
        throw new Error("No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/vacante/${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`Respuesta del servidor para vacante ${vacanteId}:`, respuesta.status, respuesta.statusText);

      if (!respuesta.ok) {
        let errorMessage = `Error al obtener las pruebas de la vacante (${respuesta.status})`;
        try {
          const errorData = await respuesta.json();
          console.error("Datos del error:", errorData);
          errorMessage = errorData.mensaje || errorMessage;
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error");
        }
        throw new Error(errorMessage);
      }

      const data = await respuesta.json();
      console.log(`Datos recibidos para vacante ${vacanteId}:`, data);
      
      // Asegurar que siempre devolvemos un array, incluso si la API devuelve null o un objeto
      if (!data) {
        console.warn("La API devolvió null o undefined para las pruebas técnicas");
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.warn("La API no devolvió un array para las pruebas técnicas:", data);
        return [];
      }
      
      return data;
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

      const data = await respuesta.json();
      
      // Normalizar datos de preguntas
      if (data.preguntas && data.preguntas.length > 0) {
        data.preguntas.forEach((pregunta: any) => {
          // Normalizar tipo de pregunta
          if (pregunta.tipoPregunta === "DESARROLLO" || pregunta.tipoPregunta === "PROJECT") {
            pregunta.tipoPregunta = "TEORICA";
          }
          
          // Convertir opciones de array a string si es necesario
          if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
            pregunta.opciones = pregunta.opciones.join('|');
          }
        });
      }
      
      // Asegurar que vacanteId esté definido si hay una vacante asociada
      if (!data.vacanteId && data.vacante && data.vacante.id) {
        data.vacanteId = data.vacante.id;
      }
      
      return data;
    } catch (error) {
      console.error(`Error en obtenerPruebaPorId(${id}):`, error);
      throw error;
    }
  },
  
  // Asignar prueba técnica a un candidato
  asignarPruebaACandidato: async (pruebaId: number, candidatoId: number, reclutadorId: number) => {
    try {
      console.log(`Asignando prueba ID: ${pruebaId} al candidato ID: ${candidatoId}`);
      const token = authService.getToken();
      
      if (!token) {
        console.error("No se encontró token de autenticación");
        throw new Error("No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaId}/asignar?candidatoId=${candidatoId}&reclutadorId=${reclutadorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`Respuesta del servidor para asignación de prueba:`, respuesta.status, respuesta.statusText);

      if (!respuesta.ok) {
        let errorMessage = `Error al asignar la prueba al candidato (${respuesta.status})`;
        try {
          const errorData = await respuesta.json();
          console.error("Datos del error:", errorData);
          errorMessage = errorData.mensaje || errorMessage;
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await respuesta.json();
      console.log(`Prueba asignada correctamente:`, data);
      return data;
    } catch (error) {
      console.error(`Error en asignarPruebaACandidato(${pruebaId}, ${candidatoId}):`, error);
      throw error;
    }
  },

  // Regenerar preguntas para una prueba existente
  regenerarPreguntasParaPrueba: async (pruebaId: number, reclutadorId: number, numPreguntas: number = 5) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaId}/regenerar-preguntas?reclutadorId=${reclutadorId}&numPreguntas=${numPreguntas}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al regenerar preguntas para la prueba técnica');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en regenerarPreguntasParaPrueba(${pruebaId}):`, error);
      throw error;
    }
  },

  // Actualizar una pregunta
  actualizarPregunta: async (preguntaId: number, reclutadorId: number, datosPregunta: any) => {
    try {
      const token = authService.getToken();
      
      // Normalizar tipos de preguntas no permitidos
      if (datosPregunta.tipoPregunta === "DESARROLLO") {
        datosPregunta.tipoPregunta = "ABIERTA";
      } else if (datosPregunta.tipoPregunta === "TEORICA") {
        datosPregunta.tipoPregunta = "TEORICA";
      } else if (datosPregunta.tipoPregunta === "PROJECT") {
        datosPregunta.tipoPregunta = "ABIERTA";
      }
      
      // Validar que tipoPregunta sea uno de los valores permitidos
      const tiposPermitidos = ["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"];
      if (!tiposPermitidos.includes(datosPregunta.tipoPregunta)) {
        console.warn(`Tipo de pregunta no válido: ${datosPregunta.tipoPregunta}. Cambiando a ABIERTA.`);
        datosPregunta.tipoPregunta = "ABIERTA";
      }
      
      // Asegurar que opciones sea un string
      if (datosPregunta.opciones && Array.isArray(datosPregunta.opciones)) {
        datosPregunta.opciones = datosPregunta.opciones.join('|');
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/preguntas/${preguntaId}?reclutadorId=${reclutadorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosPregunta)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar la pregunta');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarPregunta(${preguntaId}):`, error);
      throw error;
    }
  },
  
  // Eliminar una prueba técnica
  eliminarPruebaTecnica: async (pruebaId: number, reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/${pruebaId}?reclutadorId=${reclutadorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar la prueba técnica');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarPruebaTecnica(${pruebaId}):`, error);
      throw error;
    }
  },
  
  // Eliminar una pregunta
  eliminarPregunta: async (preguntaId: number, reclutadorId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/preguntas/${preguntaId}?reclutadorId=${reclutadorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar la pregunta');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarPregunta(${preguntaId}):`, error);
      throw error;
    }
  },
  
  // Crear una nueva pregunta
  crearPregunta: async (reclutadorId: number, datosPregunta: any) => {
    try {
      const token = authService.getToken();
      
      // Normalizar tipos de preguntas no permitidos
      if (datosPregunta.tipoPregunta === "DESARROLLO") {
        datosPregunta.tipoPregunta = "ABIERTA";
      } else if (datosPregunta.tipoPregunta === "TEORICA") {
        datosPregunta.tipoPregunta = "TEORICA";
      } else if (datosPregunta.tipoPregunta === "PROJECT") {
        datosPregunta.tipoPregunta = "ABIERTA";
      }
      
      // Validar que tipoPregunta sea uno de los valores permitidos
      const tiposPermitidos = ["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"];
      if (!tiposPermitidos.includes(datosPregunta.tipoPregunta)) {
        console.warn(`Tipo de pregunta no válido: ${datosPregunta.tipoPregunta}. Cambiando a ABIERTA.`);
        datosPregunta.tipoPregunta = "ABIERTA";
      }
      
      // Añadir orden si no existe
      if (!datosPregunta.orden) {
        datosPregunta.orden = 1;
      }
      
      // Asegurar que opciones sea un string
      if (datosPregunta.opciones && Array.isArray(datosPregunta.opciones)) {
        datosPregunta.opciones = datosPregunta.opciones.join('|');
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/preguntas?reclutadorId=${reclutadorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosPregunta)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al crear la pregunta');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en crearPregunta:`, error);
      throw error;
    }
  },

  // Obtener pruebas técnicas asignadas a un candidato
  obtenerPruebasPorCandidato: async (candidatoId: number) => {
    try {
      console.log(`Obteniendo pruebas técnicas para el candidato ID: ${candidatoId}`);
      const token = authService.getToken();
      
      if (!token) {
        console.error("No se encontró token de autenticación");
        throw new Error("No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/candidato/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`Respuesta del servidor para candidato ${candidatoId}:`, respuesta.status, respuesta.statusText);

      if (!respuesta.ok) {
        let errorMessage = `Error al obtener las pruebas del candidato (${respuesta.status})`;
        try {
          const errorData = await respuesta.json();
          console.error("Datos del error:", errorData);
          errorMessage = errorData.mensaje || errorMessage;
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error");
        }
        throw new Error(errorMessage);
      }

      const data = await respuesta.json();
      console.log(`Datos recibidos para candidato ${candidatoId}:`, data);
      
      // Asegurar que siempre devolvemos un array, incluso si la API devuelve null o un objeto
      if (!data) {
        console.warn("La API devolvió null o undefined para las pruebas técnicas");
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.warn("La API no devolvió un array para las pruebas técnicas:", data);
        // Si es un objeto único, convertirlo a array
        if (typeof data === 'object') {
          return [data];
        }
        return [];
      }
      
      // Verificar que cada elemento tenga vacanteId
      const procesados = data.map(item => {
        if (!item.vacanteId && item.vacante && item.vacante.id) {
          console.log("Corrigiendo estructura de datos: extrayendo vacanteId de objeto vacante");
          return {
            ...item,
            vacanteId: item.vacante.id,
            vacanteNombre: item.vacante.titulo || item.vacanteNombre
          };
        }
        return item;
      });
      
      console.log("Datos procesados:", procesados);
      return procesados;
    } catch (error) {
      console.error(`Error en obtenerPruebasPorCandidato(${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener prueba técnica por postulación
  obtenerPruebaPorPostulacion: async (postulacionId: number) => {
    try {
      console.log(`Buscando prueba técnica para la postulación ID: ${postulacionId}`);
      const token = authService.getToken();
      
      if (!token) {
        console.error("No se encontró token de autenticación");
        throw new Error("No se encontró token de autenticación. Por favor, inicie sesión nuevamente.");
      }
      
      const respuesta = await fetch(`${API_URL}/pruebas-tecnicas/postulacion/${postulacionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`Respuesta del servidor para postulación ${postulacionId}:`, respuesta.status, respuesta.statusText);

      // Si no se encuentra (404), devolvemos null en lugar de lanzar error
      if (respuesta.status === 404) {
        console.log("No se encontró prueba técnica para esta postulación");
        return null;
      }
      
      if (!respuesta.ok) {
        let errorMessage = `Error al obtener la prueba técnica para la postulación (${respuesta.status})`;
        try {
          const errorData = await respuesta.json();
          console.error("Datos del error:", errorData);
          errorMessage = errorData.mensaje || errorMessage;
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await respuesta.json();
      console.log(`Datos de prueba técnica para postulación ${postulacionId}:`, data);
      return data;
    } catch (error) {
      console.error(`Error en obtenerPruebaPorPostulacion(${postulacionId}):`, error);
      // Relanzar el error para que se maneje en el componente
      throw error;
    }
  },

  // Normalizar tipos de pregunta
  normalizarPregunta: (pregunta: any) => {
    try {
      const preguntaNormalizada = { ...pregunta };
      
      // Normalizar tipo de pregunta
      if (pregunta.tipoPregunta === "DESARROLLO") {
        preguntaNormalizada.tipoPregunta = "ABIERTA";
      } else if (pregunta.tipoPregunta === "TEORICA" || pregunta.tipoPregunta === "PROJECT") {
        preguntaNormalizada.tipoPregunta = "TEORICA";
      }
      
      // Asegurarse de que las opciones sean un string para preguntas de opción múltiple
      if (preguntaNormalizada.tipoPregunta === "OPCION_MULTIPLE" || preguntaNormalizada.tipoPregunta === "VERDADERO_FALSO") {
        if (Array.isArray(preguntaNormalizada.opciones)) {
          preguntaNormalizada.opciones = preguntaNormalizada.opciones.join('|');
        }
      }
      
      return preguntaNormalizada;
    } catch (error) {
      console.error('Error al normalizar pregunta:', error);
      return pregunta; // Devolver la pregunta original si hay un error
    }
  },
  
  // Normalizar tipos de datos para el envío de preguntas
  normalizarDatosPregunta: (datosPregunta: any) => {
    try {
      const preguntaNormalizada = { ...datosPregunta };
      
      // Normalizar tipo de pregunta
      if (datosPregunta.tipoPregunta === "DESARROLLO") {
        preguntaNormalizada.tipoPregunta = "ABIERTA";
      } else if (datosPregunta.tipoPregunta === "TEORICA") {
        preguntaNormalizada.tipoPregunta = "TEORICA";
      }
      
      // Asegurarse de que las opciones sean un string para preguntas de opción múltiple
      if (preguntaNormalizada.tipoPregunta === "OPCION_MULTIPLE" || preguntaNormalizada.tipoPregunta === "VERDADERO_FALSO") {
        if (Array.isArray(preguntaNormalizada.opciones)) {
          preguntaNormalizada.opciones = preguntaNormalizada.opciones.join('|');
        }
      }
      
      return preguntaNormalizada;
    } catch (error) {
      console.error('Error al normalizar datos de pregunta:', error);
      return datosPregunta; // Devolver los datos originales si hay un error
    }
  },
}; 