package com.talentmatch.service;

import java.util.List;
import java.util.Map;

/**
 * Servicio para gestionar los idiomas de los candidatos.
 */
public interface IdiomaService {
    
    /**
     * Lista todos los idiomas de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de DTOs con la información de los idiomas
     */
    List<Map<String, Object>> listarPorCandidato(Long candidatoId);
    
    /**
     * Busca un idioma específico.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     * @return DTO con la información del idioma
     */
    Map<String, Object> buscarPorId(Long candidatoId, Long idiomaId);
    
    /**
     * Crea un nuevo idioma para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos del idioma en formato Map
     * @return DTO con la información del idioma creado
     */
    Map<String, Object> crear(Long candidatoId, Map<String, Object> request);
    
    /**
     * Actualiza un idioma existente.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     * @param request Datos actualizados del idioma en formato Map
     * @return DTO con la información del idioma actualizado
     */
    Map<String, Object> actualizar(Long candidatoId, Long idiomaId, Map<String, Object> request);
    
    /**
     * Elimina un idioma.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     */
    void eliminar(Long candidatoId, Long idiomaId);
} 