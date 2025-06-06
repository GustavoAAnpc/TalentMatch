package com.talentmatch.service;

import java.util.List;
import java.util.Map;

/**
 * Servicio para gestionar la educación de los candidatos.
 */
public interface EducacionService {
    
    /**
     * Lista todas las educaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de DTOs con la información de las educaciones
     */
    List<Map<String, Object>> listarPorCandidato(Long candidatoId);
    
    /**
     * Busca una educación específica.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     * @return DTO con la información de la educación
     */
    Map<String, Object> buscarPorId(Long candidatoId, Long educacionId);
    
    /**
     * Crea una nueva educación para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la educación en formato Map
     * @return DTO con la información de la educación creada
     */
    Map<String, Object> crear(Long candidatoId, Map<String, Object> request);
    
    /**
     * Actualiza una educación existente.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     * @param request Datos actualizados de la educación en formato Map
     * @return DTO con la información de la educación actualizada
     */
    Map<String, Object> actualizar(Long candidatoId, Long educacionId, Map<String, Object> request);
    
    /**
     * Elimina una educación.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     */
    void eliminar(Long candidatoId, Long educacionId);
} 