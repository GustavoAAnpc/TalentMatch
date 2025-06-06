package com.talentmatch.service;

import java.util.List;
import java.util.Map;

/**
 * Servicio para gestionar las certificaciones de los candidatos.
 */
public interface CertificacionService {
    
    /**
     * Lista todas las certificaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de DTOs con la información de las certificaciones
     */
    List<Map<String, Object>> listarPorCandidato(Long candidatoId);
    
    /**
     * Busca una certificación específica.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     * @return DTO con la información de la certificación
     */
    Map<String, Object> buscarPorId(Long candidatoId, Long certificacionId);
    
    /**
     * Crea una nueva certificación para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la certificación en formato Map
     * @return DTO con la información de la certificación creada
     */
    Map<String, Object> crear(Long candidatoId, Map<String, Object> request);
    
    /**
     * Actualiza una certificación existente.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     * @param request Datos actualizados de la certificación en formato Map
     * @return DTO con la información de la certificación actualizada
     */
    Map<String, Object> actualizar(Long candidatoId, Long certificacionId, Map<String, Object> request);
    
    /**
     * Elimina una certificación.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     */
    void eliminar(Long candidatoId, Long certificacionId);
} 