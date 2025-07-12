package com.talentmatch.mapper;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import com.talentmatch.dto.request.CreacionPruebaTecnicaRequest;
import com.talentmatch.dto.response.EvaluacionResponse;
import com.talentmatch.dto.response.PreguntaResponse;
import com.talentmatch.dto.response.PruebaTecnicaDetalleResponse;
import com.talentmatch.dto.response.PruebaTecnicaResumenResponse;
import com.talentmatch.dto.response.PruebaTecnicaResponse;
import com.talentmatch.dto.response.RespuestaResponse;
import com.talentmatch.model.entity.Evaluacion;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Pregunta;
import com.talentmatch.model.entity.PruebaTecnica;
import com.talentmatch.model.entity.Reclutador;
import com.talentmatch.model.entity.Respuesta;

/**
 * Mapper para convertir entre la entidad PruebaTecnica y sus DTOs.
 */
@Mapper(componentModel = "spring", uses = {ReclutadorMapper.class, PreguntaMapper.class, VacanteMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class PruebaTecnicaMapper {

    @Autowired
    protected ReclutadorMapper reclutadorMapper;

    @Autowired
    protected PreguntaMapper preguntaMapper;
    
    @Autowired
    protected VacanteMapper vacanteMapper;

    /**
     * Convierte un DTO CreacionPruebaTecnicaRequest a una entidad PruebaTecnica.
     * 
     * @param request DTO CreacionPruebaTecnicaRequest a convertir
     * @param postulacion Entidad Postulacion asociada a la prueba técnica
     * @param reclutador Entidad Reclutador que crea la prueba técnica
     * @return Entidad PruebaTecnica con la información del DTO
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postulacion", source = "postulacion")
    @Mapping(target = "reclutador", source = "reclutador")
    @Mapping(target = "titulo", source = "request.titulo")
    @Mapping(target = "descripcion", source = "request.descripcion")
    @Mapping(target = "instrucciones", source = "request.instrucciones")
    @Mapping(target = "tiempoLimiteMinutos", source = "request.tiempoLimiteMinutos")
    @Mapping(target = "nivelDificultad", source = "request.nivelDificultad")
    @Mapping(target = "tecnologias", source = "request.tecnologias")
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    @Mapping(target = "fechaInicio", ignore = true)
    @Mapping(target = "fechaFinalizacion", ignore = true)
    @Mapping(target = "completada", constant = "false")
    @Mapping(target = "puntuacionTotal", ignore = true)
    @Mapping(target = "preguntas", ignore = true)
    public abstract PruebaTecnica toPruebaTecnica(CreacionPruebaTecnicaRequest request, Postulacion postulacion, Reclutador reclutador);

    /**
     * Convierte una entidad PruebaTecnica a un DTO PruebaTecnicaResponse.
     * 
     * @param pruebaTecnica Entidad PruebaTecnica a convertir
     * @param preguntas Lista de DTOs PreguntaResponse con la información de las preguntas de la prueba técnica
     * @return DTO PruebaTecnicaResponse con la información de la prueba técnica
     */
    @Mapping(target = "postulacionId", source = "pruebaTecnica.postulacion.id")
    @Mapping(target = "reclutador", source = "pruebaTecnica.reclutador")
    @Mapping(target = "titulo", source = "pruebaTecnica.titulo")
    @Mapping(target = "descripcion", source = "pruebaTecnica.descripcion")
    @Mapping(target = "instrucciones", source = "pruebaTecnica.instrucciones")
    @Mapping(target = "tiempoLimiteMinutos", source = "pruebaTecnica.tiempoLimiteMinutos")
    @Mapping(target = "nivelDificultad", source = "pruebaTecnica.nivelDificultad")
    @Mapping(target = "tecnologias", source = "pruebaTecnica.tecnologias")
    @Mapping(target = "fechaCreacion", source = "pruebaTecnica.fechaCreacion")
    @Mapping(target = "fechaActualizacion", source = "pruebaTecnica.fechaActualizacion")
    @Mapping(target = "fechaInicio", source = "pruebaTecnica.fechaInicio")
    @Mapping(target = "fechaFinalizacion", source = "pruebaTecnica.fechaFinalizacion")
    @Mapping(target = "completada", source = "pruebaTecnica.completada")
    @Mapping(target = "puntuacionTotal", source = "pruebaTecnica.puntuacionTotal")
    @Mapping(target = "preguntas", source = "preguntas")
    public abstract PruebaTecnicaResponse toPruebaTecnicaResponse(PruebaTecnica pruebaTecnica, List<PreguntaResponse> preguntas);

    /**
     * Convierte una entidad PruebaTecnica a un DTO PruebaTecnicaResponse sin incluir las preguntas.
     * 
     * @param pruebaTecnica Entidad PruebaTecnica a convertir
     * @return DTO PruebaTecnicaResponse con la información de la prueba técnica sin preguntas
     */
    @Mapping(target = "postulacionId", source = "postulacion.id")
    @Mapping(target = "reclutador", source = "reclutador")
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "descripcion", source = "descripcion")
    @Mapping(target = "instrucciones", source = "instrucciones")
    @Mapping(target = "tiempoLimiteMinutos", source = "tiempoLimiteMinutos")
    @Mapping(target = "nivelDificultad", source = "nivelDificultad")
    @Mapping(target = "tecnologias", source = "tecnologias")
    @Mapping(target = "fechaCreacion", source = "fechaCreacion")
    @Mapping(target = "fechaActualizacion", source = "fechaActualizacion")
    @Mapping(target = "fechaInicio", source = "fechaInicio")
    @Mapping(target = "fechaFinalizacion", source = "fechaFinalizacion")
    @Mapping(target = "completada", source = "completada")
    @Mapping(target = "puntuacionTotal", source = "puntuacionTotal")
    @Mapping(target = "preguntas", ignore = true)
    public abstract PruebaTecnicaResponse toPruebaTecnicaResponseSinPreguntas(PruebaTecnica pruebaTecnica);

    /**
     * Convierte una entidad PruebaTecnica a un DTO PruebaTecnicaDetalleResponse.
     * 
     * @param prueba Entidad PruebaTecnica a convertir
     * @return DTO PruebaTecnicaDetalleResponse con la información detallada de la prueba técnica
     */
    @Mapping(target = "id", source = "id")
    @Mapping(target = "postulacionId", source = "postulacion.id")
    @Mapping(target = "reclutador", source = "reclutador")
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "descripcion", source = "descripcion")
    @Mapping(target = "instrucciones", source = "instrucciones")
    @Mapping(target = "tiempoLimiteMinutos", source = "tiempoLimiteMinutos")
    @Mapping(target = "nivelDificultad", source = "nivelDificultad")
    @Mapping(target = "tecnologias", source = "tecnologias")
    @Mapping(target = "fechaCreacion", source = "fechaCreacion")
    @Mapping(target = "fechaActualizacion", source = "fechaActualizacion")
    @Mapping(target = "fechaInicio", source = "fechaInicio")
    @Mapping(target = "fechaFinalizacion", source = "fechaFinalizacion")
    @Mapping(target = "completada", source = "completada")
    @Mapping(target = "puntuacionTotal", source = "puntuacionTotal")
    @Mapping(target = "preguntas", source = "preguntas", qualifiedByName = "mapPreguntas")
    @Mapping(target = "vacante", source = "vacante")
    public abstract PruebaTecnicaDetalleResponse toPruebaTecnicaDetalleResponse(PruebaTecnica prueba);
    
    /**
     * Convierte una entidad PruebaTecnica a un DTO PruebaTecnicaResumenResponse.
     * 
     * @param prueba Entidad PruebaTecnica a convertir
     * @return DTO PruebaTecnicaResumenResponse con la información resumida de la prueba técnica
     */
    @Mapping(target = "postulacionId", source = "postulacion.id")
    @Mapping(target = "descripcion", source = "descripcion")
    @Mapping(target = "totalPreguntas", expression = "java(pruebaTecnica.getPreguntas() != null ? pruebaTecnica.getPreguntas().size() : 0)")
    @Mapping(target = "preguntasRespondidas", expression = "java(pruebaTecnica.getPreguntas() != null ? (int) pruebaTecnica.getPreguntas().stream().filter(p -> p.estaRespondida()).count() : 0)")
    @Mapping(target = "vacante", source = "vacante")
    public abstract PruebaTecnicaResumenResponse toPruebaTecnicaResumenResponse(PruebaTecnica pruebaTecnica);

    /**
     * Convierte una entidad Pregunta a un DTO PreguntaResponse.
     * 
     * @param pregunta Entidad Pregunta a convertir
     * @return DTO PreguntaResponse con la información de la pregunta
     */
    @Mapping(target = "pruebaTecnicaId", source = "pruebaTecnica.id")
    @Mapping(target = "respuestaCorrecta", source = "respuestaCorrecta")
    @Mapping(target = "respondida", expression = "java(pregunta.estaRespondida())")
    public abstract PreguntaResponse toPreguntaResponse(Pregunta pregunta);

    /**
     * Convierte una entidad Respuesta a un DTO RespuestaResponse.
     * 
     * @param respuesta Entidad Respuesta a convertir
     * @return DTO RespuestaResponse con la información de la respuesta
     */
    @Mapping(target = "preguntaId", source = "pregunta.id")
    @Mapping(target = "candidatoId", source = "candidato.id")
    @Mapping(target = "evaluada", expression = "java(respuesta.estaEvaluada())")
    public abstract RespuestaResponse toRespuestaResponse(Respuesta respuesta);

    /**
     * Convierte una entidad Evaluacion a un DTO EvaluacionResponse.
     * 
     * @param evaluacion Entidad Evaluacion a convertir
     * @return DTO EvaluacionResponse con la información de la evaluación
     */
    @Mapping(target = "pruebaTecnicaId", source = "pruebaTecnica.id")
    @Mapping(target = "respuestaId", source = "respuesta.id")
    public abstract EvaluacionResponse toEvaluacionResponse(Evaluacion evaluacion);
    
    /**
     * Método para convertir un conjunto de preguntas en una lista de respuestas.
     * 
     * @param preguntas Conjunto de preguntas a convertir
     * @return Lista de DTOs PreguntaResponse
     */
    @Named("mapPreguntas")
    public List<PreguntaResponse> mapPreguntas(Set<Pregunta> preguntas) {
        if (preguntas == null) {
            return null;
        }
        return preguntas.stream()
                .map(pregunta -> preguntaMapper.toPreguntaResponse(pregunta))
                .collect(Collectors.toList());
    }
}
