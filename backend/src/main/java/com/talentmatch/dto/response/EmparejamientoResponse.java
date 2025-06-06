package com.talentmatch.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO con la información del resultado de un emparejamiento entre candidato y vacante.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmparejamientoResponse {
    
    /**
     * Porcentaje de compatibilidad.
     */
    private Integer porcentaje;
    
    /**
     * Lista de fortalezas del candidato respecto a la vacante.
     */
    private List<String> fortalezas;
    
    /**
     * Lista de debilidades del candidato respecto a la vacante.
     */
    private List<String> debilidades;
    
    /**
     * Lista de recomendaciones para mejorar la compatibilidad.
     */
    private List<String> recomendaciones;
    
    /**
     * Fecha en que se realizó el cálculo del emparejamiento.
     */
    private LocalDateTime fechaCalculo;
    
    /**
     * Nombre de la vacante.
     */
    private String nombreVacante;
    
    /**
     * Lista de habilidades requeridas para la vacante.
     */
    private List<String> habilidadesRequeridas;
    
    /**
     * Mensaje específico para el candidato sobre su compatibilidad con la vacante.
     */
    private String mensajeCandidato;
    
    /**
     * Mensaje específico para el reclutador sobre la compatibilidad del candidato.
     */
    private String mensajeReclutador;
} 