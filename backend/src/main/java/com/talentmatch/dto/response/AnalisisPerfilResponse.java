package com.talentmatch.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la respuesta de un análisis de perfil de candidato.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalisisPerfilResponse {
    
    /**
     * Puntuación general del perfil (0-100).
     */
    private Integer puntuacion;
    
    /**
     * Lista de puntos fuertes del candidato.
     */
    private List<String> puntosFuertes;
    
    /**
     * Lista de puntos débiles o áreas de mejora del candidato.
     */
    private List<String> puntosDebiles;
    
    /**
     * Lista de recomendaciones para mejorar el perfil.
     */
    private List<String> recomendaciones;
    
    /**
     * Análisis de habilidades técnicas.
     */
    private List<HabilidadAnalizada> habilidadesAnalizadas;
    
    /**
     * Lista de categorías de vacantes compatibles con el perfil.
     */
    private List<String> categoriasCompatibles;
    
    /**
     * Clasificación del nivel de experiencia (PRINCIPIANTE, INTERMEDIO, AVANZADO, EXPERTO).
     */
    private String nivelExperiencia;
    
    /**
     * DTO anidado para representar una habilidad analizada.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HabilidadAnalizada {
        
        /**
         * Nombre de la habilidad.
         */
        private String nombre;
        
        /**
         * Nivel estimado (0-100).
         */
        private Integer nivel;
        
        /**
         * Relevancia en el mercado laboral actual (0-100).
         */
        private Integer relevancia;
    }
} 