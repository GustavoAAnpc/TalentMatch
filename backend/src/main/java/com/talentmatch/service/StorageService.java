package com.talentmatch.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Servicio para el almacenamiento de archivos.
 */
public interface StorageService {

    /**
     * Guarda un archivo en el sistema de almacenamiento.
     * 
     * @param archivo Archivo a guardar
     * @param ruta Ruta donde se guardará el archivo
     * @param nombreArchivo Nombre del archivo
     * @return URL del archivo guardado
     */
    String guardarArchivo(MultipartFile archivo, String ruta, String nombreArchivo);
    
    /**
     * Elimina un archivo del sistema de almacenamiento.
     * 
     * @param url URL del archivo a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    boolean eliminarArchivo(String url);
    
    /**
     * Obtiene la URL pública de un archivo.
     * 
     * @param rutaArchivo Ruta del archivo
     * @return URL pública del archivo
     */
    String obtenerUrlPublica(String rutaArchivo);
    
    /**
     * Genera una URL temporal firmada para acceder a un archivo.
     * 
     * @param url URL del archivo para el que generar la URL temporal
     * @param duracionMinutos Duración de la validez de la URL en minutos
     * @return URL temporal firmada
     */
    String generarUrlTemporal(String url, int duracionMinutos);
} 