package com.talentmatch.dto.request;

import java.time.LocalDateTime;

import com.talentmatch.model.enums.EstadoPostulacion;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para cambiar el estado de una postulación.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambioEstadoPostulacionRequest {

    /**
     * Nuevo estado para la postulación.
     */
    @NotNull(message = "El nuevo estado es obligatorio")
    private EstadoPostulacion nuevoEstado;

    /**
     * Comentarios del reclutador sobre la postulación.
     */
    private String comentarios;

    /**
     * Fecha programada para la entrevista (si aplica).
     */
    private LocalDateTime fechaEntrevista;
}
