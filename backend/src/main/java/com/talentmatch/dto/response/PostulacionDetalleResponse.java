package com.talentmatch.dto.response;

import java.time.LocalDateTime;

import com.talentmatch.model.enums.EstadoPostulacion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para mostrar los detalles completos de una postulación.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostulacionDetalleResponse {

    /**
     * ID de la postulación.
     */
    private Long id;
    
    /**
     * Información del candidato.
     */
    private CandidatoResponse candidato;
    
    /**
     * Información de la vacante.
     */
    private VacanteResumenResponse vacante;
    
    /**
     * Estado actual de la postulación.
     */
    private EstadoPostulacion estado;
    
    /**
     * Carta de presentación del candidato.
     */
    private String cartaPresentacion;
    
    /**
     * Puntuación de compatibilidad con la vacante (0-100).
     */
    private Integer puntuacionMatch;
    
    /**
     * Comentarios del reclutador sobre la postulación.
     */
    private String comentariosReclutador;
    
    /**
     * Fecha programada para la entrevista (si aplica).
     */
    private LocalDateTime fechaEntrevista;
    
    /**
     * Fecha de creación de la postulación.
     */
    private LocalDateTime fechaCreacion;
    
    /**
     * Fecha de la última actualización de la postulación.
     */
    private LocalDateTime fechaActualizacion;
}
