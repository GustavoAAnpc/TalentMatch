import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha en formato legible para español
 * @param fecha - Fecha en formato string (puede ser ISO o cualquier formato válido para Date)
 * @returns Fecha formateada (ejemplo: "15 de mayo de 2023")
 */
export function formatearFecha(fecha: string) {
  if (!fecha) return "-";
  
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return fecha; // Devuelve la fecha original si hay error
  }
}
