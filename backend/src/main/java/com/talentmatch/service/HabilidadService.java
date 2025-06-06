package com.talentmatch.service;

import java.util.List;
import java.util.Map;

/**
 * Servicio para gestionar las habilidades de los candidatos.
 */
public interface HabilidadService {
    
    /**
     * Lista todas las habilidades de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de DTOs con la información de las habilidades
     */
    List<Map<String, Object>> listarPorCandidato(Long candidatoId);
    
    /**
     * Busca una habilidad específica.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     * @return DTO con la información de la habilidad
     */
    Map<String, Object> buscarPorId(Long candidatoId, Long habilidadId);
    
    /**
     * Crea una nueva habilidad para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la habilidad en formato Map
     * @return DTO con la información de la habilidad creada
     */
    Map<String, Object> crear(Long candidatoId, Map<String, Object> request);
    
    /**
     * Actualiza una habilidad existente.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     * @param request Datos actualizados de la habilidad en formato Map
     * @return DTO con la información de la habilidad actualizada
     */
    Map<String, Object> actualizar(Long candidatoId, Long habilidadId, Map<String, Object> request);
    
    /**
     * Elimina una habilidad.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     */
    void eliminar(Long candidatoId, Long habilidadId);
} 