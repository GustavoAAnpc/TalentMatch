import { authService } from './authService';

const API_URL = 'http://localhost:8080/api';

export const documentoService = {
  // Subir un nuevo documento
  subirDocumento: async (candidatoId: number, archivo: File, tipo: string, descripcion?: string, establecerComoPrincipal: boolean = false) => {
    try {
      const token = authService.getToken();
      
      // Crear FormData para enviar el archivo y datos
      const formData = new FormData();
      formData.append('archivo', archivo);
      
      // Agregar parámetros directamente al FormData
      formData.append('tipo', tipo);
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }
      formData.append('establecerComoPrincipal', establecerComoPrincipal.toString());
      
      const respuesta = await fetch(`${API_URL}/v1/documentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al subir el documento');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en subirDocumento:`, error);
      throw error;
    }
  },
  
  // Obtener todos los documentos de un candidato
  obtenerDocumentos: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/v1/documentos/candidato/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener documentos. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerDocumentos(${candidatoId}):`, error);
      return [];
    }
  },
  
  // Obtener documentos por tipo
  obtenerDocumentosPorTipo: async (candidatoId: number, tipo: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/v1/documentos/candidato/${candidatoId}/tipo/${tipo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        console.error(`Error al obtener documentos por tipo. Código: ${respuesta.status}`);
        return [];
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerDocumentosPorTipo(${candidatoId}, ${tipo}):`, error);
      return [];
    }
  },
  
  // Eliminar un documento
  eliminarDocumento: async (documentoId: number, candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/v1/documentos/${documentoId}?candidatoId=${candidatoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Error al eliminar documento: ${respuesta.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarDocumento:`, error);
      throw error;
    }
  },
  
  // Establecer un documento como principal (CV)
  establecerComoPrincipal: async (documentoId: number, candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/v1/documentos/${documentoId}/principal?candidatoId=${candidatoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Error al establecer documento como principal: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en establecerComoPrincipal:`, error);
      throw error;
    }
  },
  
  // Obtener URL firmada para visualizar el documento
  obtenerUrlFirmada: async (documentoId: number) => {
    try {
      const token = authService.getToken();
      
      // Usar el nuevo endpoint específico para URL firmadas
      const respuesta = await fetch(`${API_URL}/v1/documentos/${documentoId}/view`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Error al obtener URL firmada del documento: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerUrlFirmada:`, error);
      throw error;
    }
  }
}; 