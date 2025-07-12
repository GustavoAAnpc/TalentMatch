"use client";

import { authService } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const notificacionService = {
  // Obtener todas las notificaciones de un usuario
  obtenerNotificaciones: async (usuarioId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/notificaciones/usuario/${usuarioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las notificaciones');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerNotificaciones(${usuarioId}):`, error);
      throw error;
    }
  },

  // Obtener notificaciones no leídas de un usuario
  obtenerNotificacionesNoLeidas: async (usuarioId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/notificaciones/usuario/${usuarioId}/no-leidas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener las notificaciones no leídas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerNotificacionesNoLeidas(${usuarioId}):`, error);
      throw error;
    }
  },

  // Marcar una notificación como leída
  marcarComoLeida: async (notificacionId: number, usuarioId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/notificaciones/${notificacionId}/marcar-leida?usuarioId=${usuarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al marcar la notificación como leída');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en marcarComoLeida(${notificacionId}, ${usuarioId}):`, error);
      throw error;
    }
  },

  // Marcar todas las notificaciones de un usuario como leídas
  marcarTodasComoLeidas: async (usuarioId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/notificaciones/usuario/${usuarioId}/marcar-todas-leidas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al marcar todas las notificaciones como leídas');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en marcarTodasComoLeidas(${usuarioId}):`, error);
      throw error;
    }
  },

  // Eliminar una notificación
  eliminarNotificacion: async (notificacionId: number, usuarioId: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/notificaciones/${notificacionId}?usuarioId=${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al eliminar la notificación');
      }

      return true;
    } catch (error) {
      console.error(`Error en eliminarNotificacion(${notificacionId}, ${usuarioId}):`, error);
      throw error;
    }
  }
}; 