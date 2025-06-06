package com.talentmatch.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuestas con información de evaluaciones.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluacionResponse {

    private Long id;
    private Long respuestaId;
    private Long pruebaTecnicaId;
    private Integer puntuacion;
    private String puntosFuertes;
    private String puntosMejora;
    private String retroalimentacion;
    private LocalDateTime fechaCreacion;
    private Boolean generadaPorIA;
    private LocalDateTime fechaEvaluacion;
    private String evaluador;
}
