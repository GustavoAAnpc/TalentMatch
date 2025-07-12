package com.talentmatch.service;

import java.util.List;
import java.util.Map;

import com.talentmatch.dto.request.AnalisisPerfilRequest;
import com.talentmatch.dto.response.AnalisisPerfilResponse;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.dto.response.EmparejamientoResponse;
import com.talentmatch.dto.response.VacanteResumenResponse;

/**
 * Servicio para funcionalidades relacionadas con Inteligencia Artificial.
 */
public interface IAService {

    /**
     * Calcula el emparejamiento entre un candidato y una vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return Resultado del emparejamiento
     */
    EmparejamientoResponse calcularEmparejamiento(Long candidatoId, Long vacanteId);
    
    /**
     * Recomienda vacantes para un candidato según su perfil.
     * 
     * @param candidatoId ID del candidato
     * @param limite Número máximo de vacantes a recomendar
     * @return Lista de vacantes recomendadas
     */
    List<VacanteResumenResponse> recomendarVacantes(Long candidatoId, int limite);
    
    /**
     * Recomienda candidatos para una vacante según sus perfiles.
     * 
     * @param vacanteId ID de la vacante
     * @param limite Número máximo de candidatos a recomendar
     * @return Lista de candidatos recomendados
     */
    List<CandidatoResponse> recomendarCandidatos(Long vacanteId, int limite);
    
    /**
     * Analiza el perfil de un candidato y genera recomendaciones.
     * 
     * @param request Datos para el análisis
     * @return Resultado del análisis
     */
    AnalisisPerfilResponse analizarPerfil(AnalisisPerfilRequest request);
    
    /**
     * Genera una descripción optimizada para una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @return Descripción generada
     */
    String generarDescripcionVacante(Long vacanteId);
    
    /**
     * Genera una descripción de vacante basada en parámetros sin requerir una vacante existente.
     * 
     * @param parametros Mapa con los datos de la vacante (título, habilidades, etc.)
     * @return Descripción generada
     */
    String generarDescripcionParametrizada(Map<String, Object> parametros);
    
    /**
     * Genera contenido completo para una vacante (descripción, requisitos, beneficios y habilidades).
     * 
     * @param parametros Mapa con los datos de la vacante y el prompt personalizado
     * @return Texto estructurado con secciones para cada parte del contenido
     */
    String generarContenidoCompleto(Map<String, Object> parametros);
    
    /**
     * Analiza la compatibilidad entre todos los candidatos postulados a una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @return Mapa con los resultados del análisis de candidatos
     */
    Map<String, Object> analizarCandidatosPostulados(Long vacanteId);

    /**
     * Calcula los emparejamientos de un candidato con todas las vacantes disponibles.
     * 
     * @param candidatoId ID del candidato
     * @param limite Número máximo de vacantes a evaluar
     * @return Lista de resultados de emparejamiento
     */
    List<EmparejamientoResponse> calcularEmparejamientosCandidato(Long candidatoId, int limite);
} 