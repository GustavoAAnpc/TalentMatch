package com.talentmatch.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitudes de creación de preguntas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreacionPreguntaRequest {

    @NotNull(message = "El ID de la prueba técnica es obligatorio")
    private Long pruebaTecnicaId;

    @NotBlank(message = "El enunciado es obligatorio")
    private String enunciado;

    /**
     * Tipo de pregunta (OPCION_MULTIPLE, ABIERTA, VERDADERO_FALSO, CODIGO, TEORICA)
     */
    @NotBlank(message = "El tipo de pregunta es obligatorio")
    @Pattern(regexp = "^(OPCION_MULTIPLE|ABIERTA|VERDADERO_FALSO|CODIGO|TEORICA)$", 
            message = "El tipo de pregunta debe ser OPCION_MULTIPLE, ABIERTA, VERDADERO_FALSO, CODIGO o TEORICA")
    private String tipoPregunta;

    private String opciones;

    private String respuestaCorrecta;

    @Min(value = 0, message = "La puntuación debe ser mayor o igual a 0")
    private Integer puntuacion;

    @Min(value = 1, message = "El orden debe ser mayor o igual a 1")
    private Integer orden;
    
    // Campos y métodos adicionales utilizados en PruebaTecnicaServiceImpl
    private String texto;
    private String tipo;
    private String opcionesRespuesta;
    private Integer puntuacionMaxima;
    private String respuestaEsperada;
    
    /**
     * Obtiene el texto de la pregunta.
     * 
     * @return Texto de la pregunta o el enunciado si el texto es nulo
     */
    public String getTexto() {
        return (texto != null) ? texto : enunciado;
    }
    
    /**
     * Obtiene el tipo de la pregunta.
     * 
     * @return Tipo de la pregunta o el tipoPregunta si el tipo es nulo
     */
    public String getTipo() {
        return (tipo != null) ? tipo : tipoPregunta;
    }
    
    /**
     * Obtiene las opciones de respuesta.
     * 
     * @return Opciones de respuesta o las opciones si las opciones de respuesta son nulas
     */
    public String getOpcionesRespuesta() {
        return (opcionesRespuesta != null) ? opcionesRespuesta : opciones;
    }
    
    /**
     * Obtiene la puntuación máxima.
     * 
     * @return Puntuación máxima o la puntuación si la puntuación máxima es nula
     */
    public Integer getPuntuacionMaxima() {
        return (puntuacionMaxima != null) ? puntuacionMaxima : puntuacion;
    }
    
    /**
     * Obtiene la respuesta esperada.
     * 
     * @return Respuesta esperada o la respuesta correcta si la respuesta esperada es nula
     */
    public String getRespuestaEsperada() {
        return (respuestaEsperada != null) ? respuestaEsperada : respuestaCorrecta;
    }
    
    /**
     * Obtiene las opciones.
     * 
     * @return Opciones
     */
    public String getOpciones() {
        return opciones;
    }
}
