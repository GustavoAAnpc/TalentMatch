"use client";

import { authService } from './authService';

// Usar variable de entorno o valor predeterminado
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const postulacionService = {
  // Obtener todas las postulaciones de un candidato
  obtenerPostulaciones: async (candidatoId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones/candidato/${candidatoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las postulaciones');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPostulaciones(${candidatoId}):`, error);
      throw error;
    }
  },

  // Obtener postulaciones por estado
  obtenerPostulacionesPorEstado: async (candidatoId: number, estado: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones/candidato/${candidatoId}/estado/${estado}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || `Error al obtener postulaciones con estado ${estado}`);
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPostulacionesPorEstado(${candidatoId}, ${estado}):`, error);
      throw error;
    }
  },

  // Obtener detalle de una postulación específica
  obtenerPostulacion: async (id: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener el detalle de la postulación');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerPostulacion(${id}):`, error);
      throw error;
    }
  },

  // Crear una nueva postulación
  crearPostulacion: async (candidatoId: number, datos: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones?candidatoId=${candidatoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al crear la postulación');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en crearPostulacion(${candidatoId}):`, error);
      throw error;
    }
  },

  // Subir un documento adicional a una postulación
  subirDocumento: async (postulacionId: number, candidatoId: number, documento: File, nombreDocumento: string) => {
    try {
      const token = authService.getToken();
      
      const formData = new FormData();
      formData.append('archivo', documento);
      formData.append('nombreDocumento', nombreDocumento);
      
      const respuesta = await fetch(`${API_URL}/postulaciones/${postulacionId}/documentos?candidatoId=${candidatoId}`, {
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

      return await respuesta.text();
    } catch (error) {
      console.error(`Error en subirDocumento(${postulacionId}, ${candidatoId}):`, error);
      throw error;
    }
  },

  // Verificar si existe una postulación para una vacante específica
  verificarPostulacion: async (candidatoId: number, vacanteId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones/verificar?candidatoId=${candidatoId}&vacanteId=${vacanteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al verificar la postulación');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en verificarPostulacion(${candidatoId}, ${vacanteId}):`, error);
      throw error;
    }
  },

  // Actualizar carta de presentación
  actualizarCartaPresentacion: async (postulacionId: number, cartaPresentacion: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/postulaciones/${postulacionId}/carta-presentacion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartaPresentacion })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar la carta de presentación');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarCartaPresentacion(${postulacionId}):`, error);
      throw error;
    }
  }
}; 