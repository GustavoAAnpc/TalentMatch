package com.talentmatch.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.talentmatch.model.enums.EstadoVacante;
import com.talentmatch.model.enums.Modalidad;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuestas con información resumida de vacantes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class VacanteResumenResponse {
    
    /**
     * ID de la vacante.
     */
    private Long id;
    
    /**
     * Título de la vacante.
     */
    private String titulo;
    
    /**
     * Salario ofrecido para la vacante.
     */
    private BigDecimal salario;
    
    /**
     * Área de la vacante.
     */
    private String area;
    
    /**
     * Ubicación de la vacante.
     */
    private String ubicacion;
    
    /**
     * Modalidad de trabajo (presencial, remoto, híbrido).
     */
    private Modalidad modalidad;
    
    /**
     * Estado de la vacante.
     */
    private EstadoVacante estado;
    
    /**
     * Fecha de publicación de la vacante.
     */
    private LocalDate fechaPublicacion;
    
    /**
     * ID del reclutador que publicó la vacante.
     */
    private Long reclutadorId;
    
    /**
     * Nombre completo del reclutador que publicó la vacante.
     */
    private String nombreReclutador;
    
    /**
     * Total de postulaciones para la vacante.
     */
    private Integer totalPostulaciones;
    
    /**
     * Porcentaje de compatibilidad con el candidato (0-100).
     */
    private Integer compatibilidad;
    
    /**
     * Habilidades requeridas para la vacante.
     */
    private String habilidadesRequeridas;
}
