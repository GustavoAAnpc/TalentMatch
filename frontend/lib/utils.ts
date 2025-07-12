import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha en formato dd/mm/aaaa
 * @param fecha - Fecha en formato string, Date o objeto con propiedades de fecha
 * @returns Fecha formateada (ejemplo: "15/05/2023")
 */
export function formatearFecha(fecha: any) {
  if (!fecha) return "-";
  
  try {
    let dia: string, mes: string, anio: string | number;
    
    // Manejar diferentes tipos de entrada
    if (fecha instanceof Date) {
      dia = fecha.getDate().toString().padStart(2, '0');
      mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses son 0-indexed
      anio = fecha.getFullYear();
    } else if (typeof fecha === 'string') {
      // Si es una cadena ISO con T
      if (fecha.includes('T')) {
        const [fechaParte] = fecha.split('T');
        const [anioStr, mesStr, diaStr] = fechaParte.split('-');
        dia = diaStr;
        mes = mesStr;
        anio = anioStr;
      } 
      // Si es una cadena con formato YYYY-MM-DD
      else if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [anioStr, mesStr, diaStr] = fecha.split('-');
        dia = diaStr;
        mes = mesStr;
        anio = anioStr;
      } 
      // Intenta crear una fecha a partir de la cadena
      else {
        const dateObj = new Date(fecha);
        if (isNaN(dateObj.getTime())) {
          return "-";
        }
        dia = dateObj.getDate().toString().padStart(2, '0');
        mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        anio = dateObj.getFullYear();
      }
    } else if (typeof fecha === 'object' && fecha !== null) {
      // Si es un objeto LocalDate de Java
      if ('year' in fecha && 'month' in fecha && 'day' in fecha) {
        dia = String(fecha.day).padStart(2, '0');
        mes = String(fecha.month).padStart(2, '0');
        anio = fecha.year;
      } 
      // Si tiene una propiedad date (común en respuestas JSON de Java)
      else if ('date' in fecha) {
        if (typeof fecha.date === 'string') {
          return formatearFecha(fecha.date);
        } else {
          const dateObj = new Date(fecha.date);
          if (isNaN(dateObj.getTime())) {
            return "-";
          }
          dia = dateObj.getDate().toString().padStart(2, '0');
          mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          anio = dateObj.getFullYear();
        }
      } 
      // Si tiene método toISOString
      else if (fecha.toISOString && typeof fecha.toISOString === 'function') {
        return formatearFecha(fecha.toISOString());
      } else {
        // Último recurso: intentar convertir a string
        return formatearFecha(String(fecha));
      }
    } else {
      return "-";
    }
    
    // Devolver en formato dd/mm/aaaa
    return `${dia}/${mes}/${anio}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error, "Valor recibido:", fecha, "Tipo:", typeof fecha);
    return "-"; // Devuelve un guion si hay error
  }
}
