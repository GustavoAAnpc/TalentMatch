package com.talentmatch.service.impl;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.storage.Acl;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageException;
import com.talentmatch.exception.ArchivoException;
import com.talentmatch.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de almacenamiento usando Firebase Storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseStorageServiceImpl implements StorageService {

    private final Storage storage;

    @Value("${firebase.storage.bucket}")
    private String bucketName;

    @Override
    public String guardarArchivo(MultipartFile archivo, String ruta, String nombreArchivo) {
        try {
            log.info("Guardando archivo '{}' en ruta '{}'", nombreArchivo, ruta);
            
            String rutaCompleta = ruta + "/" + nombreArchivo;
            BlobId blobId = BlobId.of(bucketName, rutaCompleta);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(archivo.getContentType())
                    // Configurar el archivo como públicamente accesible
                    .setAcl(new ArrayList<>(Arrays.asList(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER))))
                    .build();

            // Crear el blob con acceso público
            storage.create(blobInfo, archivo.getBytes());
            
            // Generar una URL corta directa al recurso
            String urlDirecta = String.format("https://storage.googleapis.com/%s/%s", 
                                            bucketName, rutaCompleta);
            
            log.info("Archivo guardado exitosamente: {}", rutaCompleta);
            log.debug("URL directa generada: {}", urlDirecta);
            
            return urlDirecta;
        } catch (IOException e) {
            log.error("Error al leer el archivo: {}", e.getMessage(), e);
            throw new ArchivoException("Error al leer el archivo: " + e.getMessage());
        } catch (StorageException e) {
            log.error("Error al guardar el archivo en Firebase: {}", e.getMessage(), e);
            throw new ArchivoException("Error al guardar el archivo en Firebase: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al guardar el archivo: {}", e.getMessage(), e);
            throw new ArchivoException("Error inesperado al guardar el archivo: " + e.getMessage());
        }
    }

    @Override
    public boolean eliminarArchivo(String url) {
        try {
            // Extrae el nombre del archivo de la URL
            String nombreArchivo = extraerNombreArchivo(url);
            BlobId blobId = BlobId.of(bucketName, nombreArchivo);
            
            boolean eliminado = storage.delete(blobId);
            
            if (eliminado) {
                log.info("Archivo eliminado exitosamente: {}", nombreArchivo);
            } else {
                log.warn("No se pudo eliminar el archivo: {}", nombreArchivo);
            }
            
            return eliminado;
        } catch (StorageException e) {
            log.error("Error al eliminar el archivo de Firebase", e);
            throw new ArchivoException("Error al eliminar el archivo de Firebase: " + e.getMessage());
        }
    }

    @Override
    public String obtenerUrlPublica(String rutaArchivo) {
        try {
            BlobId blobId = BlobId.of(bucketName, rutaArchivo);
            Blob blob = storage.get(blobId);
            
            if (blob == null) {
                log.warn("No se encontró el archivo: {}", rutaArchivo);
                throw new ArchivoException("No se encontró el archivo: " + rutaArchivo);
            }
            
            log.info("URL pública generada para: {}", rutaArchivo);
            return blob.getMediaLink();
        } catch (StorageException e) {
            log.error("Error al obtener URL pública", e);
            throw new ArchivoException("Error al obtener URL pública: " + e.getMessage());
        }
    }

    public String generarUrlTemporal(String url, int duracionMinutos) {
        try {
            log.info("Generando URL temporal para: {}", url);
            String nombreArchivo = extraerNombreArchivo(url);
            log.debug("Nombre de archivo extraído: {}", nombreArchivo);
            
            // Verificar que el nombre de archivo no sea una URL completa
            if (nombreArchivo.startsWith("http")) {
                log.warn("No se pudo extraer correctamente el nombre del archivo, intentando procesamiento alternativo");
                
                // Si contiene el nombre del bucket dos veces, es posible que la URL esté duplicada
                if (nombreArchivo.contains(bucketName + "/" + bucketName) || 
                    nombreArchivo.contains(bucketName + "/" + "https://")) {
                    log.warn("Detectada URL malformada con duplicación de bucket o protocolo");
                    
                    // Intentar corregir la URL duplicada
                    if (nombreArchivo.contains(bucketName + "/https://")) {
                        nombreArchivo = nombreArchivo.substring(nombreArchivo.indexOf("https://"));
                        nombreArchivo = extraerNombreArchivo(nombreArchivo);
                        log.debug("URL corregida, nuevo nombre de archivo: {}", nombreArchivo);
                    }
                }
            }
            
            BlobId blobId = BlobId.of(bucketName, nombreArchivo);
            
            // Verificar si el blob existe
            Blob blob = storage.get(blobId);
            if (blob == null) {
                log.error("No se encontró el archivo en el bucket: {}/{}", bucketName, nombreArchivo);
                throw new ArchivoException("No se encontró el archivo: " + nombreArchivo);
            }
            
            URL signedUrl = storage.signUrl(BlobInfo.newBuilder(blobId).build(), 
                    duracionMinutos, TimeUnit.MINUTES);
            
            log.info("URL temporal generada exitosamente para: {}", nombreArchivo);
            
            return signedUrl.toString();
        } catch (StorageException e) {
            log.error("Error al generar URL temporal para {}: {}", url, e.getMessage(), e);
            throw new ArchivoException("Error al generar URL temporal: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al generar URL temporal para {}: {}", url, e.getMessage(), e);
            throw new ArchivoException("Error inesperado al generar URL temporal: " + e.getMessage());
        }
    }
    
    /**
     * Método auxiliar para extraer el nombre del archivo de una URL.
     * 
     * @param url URL del archivo
     * @return Nombre del archivo extraído
     */
    private String extraerNombreArchivo(String url) {
        try {
            log.debug("Extrayendo nombre de archivo de URL: {}", url);
            
            // Para URLs firmadas, eliminar los parámetros de consulta primero
            if (url.contains("?")) {
                url = url.split("\\?")[0];
                log.debug("URL limpiada de parámetros de consulta: {}", url);
            }
            
            // Caso 1: URL de storage.googleapis.com con formato /download/storage/v1/b/BUCKET/o/...
            if (url.contains("storage.googleapis.com/download/storage/v1/b/")) {
                String[] partes = url.split("/o/");
                if (partes.length > 1) {
                    String nombreCodificado = partes[1];
                    log.debug("Nombre codificado extraído (caso 1): {}", nombreCodificado);
                    return java.net.URLDecoder.decode(nombreCodificado, java.nio.charset.StandardCharsets.UTF_8);
                }
            }
            
            // Caso 2: URL con formato firebase.googleapis.com
            else if (url.contains("firebase.googleapis.com")) {
                String[] partes = url.split("/o/");
                if (partes.length > 1) {
                    String nombreCodificado = partes[1];
                    log.debug("Nombre codificado extraído (caso 2): {}", nombreCodificado);
                    return java.net.URLDecoder.decode(nombreCodificado, java.nio.charset.StandardCharsets.UTF_8);
                }
            }
            
            // Caso 3: URL simplificada de storage.googleapis.com (formato directo al bucket)
            else if (url.contains("storage.googleapis.com/" + bucketName + "/")) {
                String rutaArchivo = url.substring(url.indexOf(bucketName) + bucketName.length() + 1);
                log.debug("Ruta de archivo extraída (caso 3): {}", rutaArchivo);
                return rutaArchivo;
            }
            
            // Caso 4: URL es la ruta directa dentro del bucket (sin https://...)
            else if (!url.startsWith("http")) {
                return url;
            }
            
            // Caso 5: Cualquier otro formato de URL que contenga el nombre del bucket
            else if (url.contains(bucketName)) {
                // Buscar el bucket en la URL y extraer la ruta después de él
                int indiceBucket = url.indexOf(bucketName);
                if (indiceBucket >= 0) {
                    int indiceInicio = indiceBucket + bucketName.length();
                    // Asegurarse de que hay un '/' después del nombre del bucket
                    if (indiceInicio < url.length() && url.charAt(indiceInicio) == '/') {
                        indiceInicio++;
                    }
                    
                    String rutaArchivo = url.substring(indiceInicio);
                    log.debug("Ruta de archivo extraída (caso 5): {}", rutaArchivo);
                    return rutaArchivo;
                }
            }
            
            log.warn("No se pudo extraer el nombre del archivo usando patrones conocidos, usando la URL completa: {}", url);
            // Si llegamos aquí, no pudimos extraer el nombre del archivo
            return url;
        } catch (Exception e) {
            log.error("Error al extraer nombre de archivo de URL: {}", e.getMessage(), e);
            return url; // En caso de error, devolvemos la URL completa
        }
    }
} 