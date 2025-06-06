package com.talentmatch.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitudes de creación de respuestas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreacionRespuestaRequest {

    @NotNull(message = "El ID de la pregunta es obligatorio")
    private Long preguntaId;

    @NotBlank(message = "El contenido es obligatorio")
    private String contenido;

    private Integer tiempoRespuestaSegundos;
    
    private String texto;
    
    private String opcionSeleccionada;
    
    /**
     * Obtiene el texto de la respuesta.
     * 
     * @return Texto de la respuesta o el contenido si el texto es nulo
     */
    public String getTexto() {
        return (texto != null) ? texto : contenido;
    }
    
    /**
     * Obtiene la opción seleccionada.
     * 
     * @return Opción seleccionada
     */
    public String getOpcionSeleccionada() {
        return opcionSeleccionada;
    }
}
