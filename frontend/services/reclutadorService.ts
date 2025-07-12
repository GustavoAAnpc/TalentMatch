"use client";

import { authService } from './authService';

// Usar variable de entorno o valor predeterminado
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const reclutadorService = {
  // Obtener información de un reclutador por su id
  obtenerReclutador: async (id: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/reclutadores/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener información del reclutador');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerReclutador(${id}):`, error);
      throw error;
    }
  },

  // Actualizar información de un reclutador
  actualizarReclutador: async (id: number, datos: any) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/reclutadores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar información del reclutador');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en actualizarReclutador(${id}):`, error);
      throw error;
    }
  },

  // Actualizar foto de perfil del reclutador
  actualizarFotoPerfil: async (id: number, foto: File) => {
    try {
      const token = authService.getToken();
      
      const formData = new FormData();
      formData.append('archivo', foto);
      
      const respuesta = await fetch(`${API_URL}/reclutadores/${id}/foto-perfil`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al actualizar la foto de perfil');
      }

      return await respuesta.text();
    } catch (error) {
      console.error(`Error en actualizarFotoPerfil(${id}):`, error);
      throw error;
    }
  },
  
  // Obtener estadísticas para el dashboard del reclutador completo (incluye datos avanzados con IA)
  obtenerEstadisticasDashboard: async (id: number) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/reclutadores/${id}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener estadísticas del dashboard');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en obtenerEstadisticasDashboard(${id}):`, error);
      throw error;
    }
  },

  // Obtener estadísticas básicas del reclutador (rápidas, sin datos de IA)
  obtenerEstadisticas: async (id: number) => {
    try {
      const token = authService.getToken();
      
      // Primero obtenemos al reclutador
      const reclutador = await reclutadorService.obtenerReclutador(id);
      
      // Obtenemos sus vacantes
      const respuesta = await fetch(`${API_URL}/vacantes/reclutador/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al obtener vacantes del reclutador');
      }

      const vacantes = await respuesta.json();
      
      // Calculamos estadísticas básicas
      const vacantesActivas = vacantes.filter((v: any) => v.estado === 'ACTIVA').length;
      const vacantesCerradas = vacantes.filter((v: any) => v.estado === 'CERRADA').length;
      const vacantesTotal = vacantes.length;
      
      // Obtenemos las más recientes
      const vacantesRecientes = vacantes
        .filter((v: any) => v.estado === 'ACTIVA')
        .sort((a: any, b: any) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime())
        .slice(0, 5);
      
      return {
        reclutador,
        vacantesActivas,
        vacantesCerradas,
        vacantesTotal,
        vacantesRecientes,
        // Estos valores serán completados por la carga avanzada
        candidatosTotal: 0,
        candidatosAnalizados: 0,
        contratacionesTotal: 0,
        diasPromedioContratacion: 0,
        tasaConversion: 0
      };
    } catch (error) {
      console.error(`Error en obtenerEstadisticas(${id}):`, error);
      throw error;
    }
  },

  // Buscar reclutadores por departamento
  buscarPorDepartamento: async (departamento: string) => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/reclutadores/buscar?departamento=${departamento}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al buscar reclutadores por departamento');
      }

      return await respuesta.json();
    } catch (error) {
      console.error(`Error en buscarPorDepartamento(${departamento}):`, error);
      throw error;
    }
  },

  // Listar todos los reclutadores
  listarTodos: async () => {
    try {
      const token = authService.getToken();
      
      const respuesta = await fetch(`${API_URL}/reclutadores`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.mensaje || 'Error al listar todos los reclutadores');
      }

      return await respuesta.json();
    } catch (error) {
      console.error('Error en listarTodos:', error);
      throw error;
    }
  }
}; 