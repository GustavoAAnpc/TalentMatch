package com.talentmatch.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.talentmatch.dto.request.CreacionEvaluacionRequest;
import com.talentmatch.dto.response.EvaluacionResponse;
import com.talentmatch.model.entity.Evaluacion;
import com.talentmatch.model.entity.Respuesta;

/**
 * Mapper para convertir entre la entidad Evaluacion y sus DTOs.
 */
@Mapper(componentModel = "spring")
public interface EvaluacionMapper {

    /**
     * Convierte un DTO CreacionEvaluacionRequest a una entidad Evaluacion.
     * 
     * @param request DTO CreacionEvaluacionRequest a convertir
     * @param respuesta Entidad Respuesta asociada a la evaluación
     * @return Entidad Evaluacion con la información del DTO
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "respuesta", source = "respuesta")
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "evaluador", ignore = true)
    @Mapping(target = "fechaEvaluacion", ignore = true)
    @Mapping(target = "pruebaTecnica", ignore = true)
    Evaluacion toEvaluacion(CreacionEvaluacionRequest request, Respuesta respuesta);

    /**
     * Convierte una entidad Evaluacion a un DTO EvaluacionResponse.
     * 
     * @param evaluacion Entidad Evaluacion a convertir
     * @return DTO EvaluacionResponse con la información de la evaluación
     */
    @Mapping(target = "respuestaId", source = "respuesta.id")
    @Mapping(target = "pruebaTecnicaId", source = "pruebaTecnica.id")
    EvaluacionResponse toEvaluacionResponse(Evaluacion evaluacion);
}
