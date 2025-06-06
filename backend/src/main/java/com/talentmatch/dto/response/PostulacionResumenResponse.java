package com.talentmatch.dto.response;

import java.time.LocalDateTime;

import com.talentmatch.model.enums.EstadoPostulacion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para mostrar un resumen de una postulación.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostulacionResumenResponse {

    /**
     * ID de la postulación.
     */
    private Long id;
    
    /**
     * ID del candidato.
     */
    private Long candidatoId;
    
    /**
     * Nombre completo del candidato.
     */
    private String candidatoNombre;
    
    /**
     * ID de la vacante.
     */
    private Long vacanteId;
    
    /**
     * Título de la vacante.
     */
    private String vacanteTitulo;
    
    /**
     * Estado actual de la postulación.
     */
    private EstadoPostulacion estado;
    
    /**
     * Puntuación de compatibilidad con la vacante (0-100).
     */
    private Integer puntuacionMatch;
    
    /**
     * Fecha de creación de la postulación.
     */
    private LocalDateTime fechaCreacion;
    
    /**
     * Fecha de la última actualización de la postulación.
     */
    private LocalDateTime fechaActualizacion;
}
