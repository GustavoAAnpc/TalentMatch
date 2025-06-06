package com.talentmatch.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.SubirDocumentoRequest;
import com.talentmatch.dto.response.DocumentoResponse;
import com.talentmatch.model.entity.Documento;

public interface DocumentoService {
    
    /**
     * Sube un nuevo documento para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param archivo Archivo a subir
     * @param request Datos del documento
     * @return Respuesta con los datos del documento subido
     */
    DocumentoResponse subirDocumento(Long candidatoId, MultipartFile archivo, SubirDocumentoRequest request);
    
    /**
     * Obtiene todos los documentos de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de documentos
     */
    List<DocumentoResponse> obtenerDocumentosPorCandidato(Long candidatoId);
    
    /**
     * Obtiene todos los documentos de un candidato de un tipo específico.
     * 
     * @param candidatoId ID del candidato
     * @param tipo Tipo de documento
     * @return Lista de documentos
     */
    List<DocumentoResponse> obtenerDocumentosPorTipo(Long candidatoId, String tipo);
    
    /**
     * Obtiene un documento por su ID.
     * 
     * @param id ID del documento
     * @return Documento encontrado
     */
    DocumentoResponse obtenerPorId(Long id);
    
    /**
     * Elimina un documento.
     * 
     * @param id ID del documento
     * @param candidatoId ID del candidato (para validación)
     */
    void eliminarDocumento(Long id, Long candidatoId);
    
    /**
     * Establece un documento como principal (CV).
     * 
     * @param id ID del documento
     * @param candidatoId ID del candidato (para validación)
     * @return Documento actualizado
     */
    DocumentoResponse establecerComoPrincipal(Long id, Long candidatoId);
    
    /**
     * Obtiene el documento principal (CV) de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Documento principal o null si no existe
     */
    DocumentoResponse obtenerDocumentoPrincipal(Long candidatoId);
    
    /**
     * Busca un documento por su ID.
     * 
     * @param id ID del documento
     * @return Documento encontrado
     */
    Documento buscarDocumentoPorId(Long id);
} 