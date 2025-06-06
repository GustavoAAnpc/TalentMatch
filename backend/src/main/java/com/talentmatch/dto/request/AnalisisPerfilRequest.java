package com.talentmatch.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitar un análisis de perfil de un candidato.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalisisPerfilRequest {

    /**
     * ID del candidato a analizar.
     */
    @NotNull(message = "El ID del candidato es obligatorio")
    private Long candidatoId;
    
    /**
     * Flag para indicar si se debe incluir recomendaciones en el análisis.
     */
    private boolean incluirRecomendaciones;
    
    /**
     * Flag para indicar si se debe analizar el CV en detalle.
     */
    private boolean analizarCV;
    
    /**
     * Flag para indicar si se debe hacer un análisis de habilidades técnicas.
     */
    private boolean analizarHabilidadesTecnicas;
    
    /**
     * Flag para indicar si se debe hacer un análisis de compatibilidad con vacantes existentes.
     */
    private boolean analizarCompatibilidadVacantes;
} 