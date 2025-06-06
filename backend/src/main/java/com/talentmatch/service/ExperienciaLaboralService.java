package com.talentmatch.service;

import java.util.List;
import java.util.Map;

/**
 * Servicio para gestionar las experiencias laborales de los candidatos.
 */
public interface ExperienciaLaboralService {
    
    /**
     * Lista todas las experiencias laborales de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de DTOs con la información de las experiencias laborales
     */
    List<Map<String, Object>> listarPorCandidato(Long candidatoId);
    
    /**
     * Busca una experiencia laboral específica.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @return DTO con la información de la experiencia laboral
     */
    Map<String, Object> buscarPorId(Long candidatoId, Long experienciaId);
    
    /**
     * Crea una nueva experiencia laboral para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la experiencia laboral en formato Map
     * @return DTO con la información de la experiencia laboral creada
     */
    Map<String, Object> crear(Long candidatoId, Map<String, Object> request);
    
    /**
     * Actualiza una experiencia laboral existente.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @param request Datos actualizados de la experiencia laboral en formato Map
     * @return DTO con la información de la experiencia laboral actualizada
     */
    Map<String, Object> actualizar(Long candidatoId, Long experienciaId, Map<String, Object> request);
    
    /**
     * Elimina una experiencia laboral.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     */
    void eliminar(Long candidatoId, Long experienciaId);
} 