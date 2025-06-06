package com.talentmatch.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuestas con información de respuestas a preguntas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RespuestaResponse {

    private Long id;
    private Long preguntaId;
    private Long candidatoId;
    private String contenido;
    private String texto;
    private String opcionSeleccionada;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaRespuesta;
    private Integer tiempoRespuestaSegundos;
    private Boolean evaluada;
    private EvaluacionResponse evaluacion;
}
