package com.talentmatch.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import com.talentmatch.dto.request.CambioEstadoPostulacionRequest;
import com.talentmatch.dto.request.CreacionPostulacionRequest;
import com.talentmatch.dto.response.PostulacionDetalleResponse;
import com.talentmatch.dto.response.PostulacionResumenResponse;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.enums.EstadoPostulacion;

/**
 * Mapper para convertir entre la entidad Postulacion y sus DTOs.
 */
@Mapper(componentModel = "spring", uses = {CandidatoMapper.class, VacanteMapper.class})
public abstract class PostulacionMapper {

    @Autowired
    protected CandidatoMapper candidatoMapper;

    @Autowired
    protected VacanteMapper vacanteMapper;

    /**
     * Convierte una entidad Postulacion en un DTO con detalles completos.
     * 
     * @param postulacion Entidad a convertir
     * @return DTO con detalles de la postulación
     */
    @Mapping(target = "candidato", expression = "java(candidatoMapper.toCandidatoResponse(postulacion.getCandidato()))")
    @Mapping(target = "vacante", expression = "java(vacanteMapper.toVacanteResumenResponse(postulacion.getVacante()))")
    public abstract PostulacionDetalleResponse toPostulacionDetalleResponse(Postulacion postulacion);

    /**
     * Convierte una entidad Postulacion en un DTO con información resumida.
     * 
     * @param postulacion Entidad a convertir
     * @return DTO con resumen de la postulación
     */
    @Mapping(target = "candidatoId", expression = "java(postulacion.getCandidato().getId())")
    @Mapping(target = "candidatoNombre", expression = "java(postulacion.getCandidato().getNombre() + ' ' + postulacion.getCandidato().getApellido())")
    @Mapping(target = "vacanteId", expression = "java(postulacion.getVacante().getId())")
    @Mapping(target = "vacanteTitulo", expression = "java(postulacion.getVacante().getTitulo())")
    public abstract PostulacionResumenResponse toPostulacionResumenResponse(Postulacion postulacion);

    /**
     * Convierte un DTO de creación en una entidad Postulacion.
     * 
     * @param request DTO con los datos para crear
     * @param candidato Entidad del candidato
     * @param vacante Entidad de la vacante
     * @return Entidad Postulacion creada
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidato", source = "candidato")
    @Mapping(target = "vacante", source = "vacante")
    @Mapping(target = "estado", expression = "java(getEstadoAplicada())")
    @Mapping(target = "cartaPresentacion", source = "request.cartaPresentacion")
    @Mapping(target = "puntuacionMatch", ignore = true)
    @Mapping(target = "comentariosReclutador", ignore = true)
    @Mapping(target = "fechaEntrevista", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    public abstract Postulacion toPostulacion(CreacionPostulacionRequest request, Candidato candidato, Vacante vacante);

    /**
     * Actualiza una entidad Postulacion con los datos de un DTO de cambio de estado.
     * 
     * @param postulacion Entidad a actualizar
     * @param request DTO con los nuevos datos
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidato", ignore = true)
    @Mapping(target = "vacante", ignore = true)
    @Mapping(target = "cartaPresentacion", ignore = true)
    @Mapping(target = "puntuacionMatch", ignore = true)
    @Mapping(target = "estado", source = "request.nuevoEstado")
    @Mapping(target = "comentariosReclutador", source = "request.comentarios")
    @Mapping(target = "fechaEntrevista", source = "request.fechaEntrevista")
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    public abstract void actualizarDesdeRequest(@MappingTarget Postulacion postulacion, CambioEstadoPostulacionRequest request);

    /**
     * Obtiene el estado inicial para una postulación.
     * 
     * @return Estado APLICADA
     */
    protected EstadoPostulacion getEstadoAplicada() {
        return EstadoPostulacion.APLICADA;
    }
}
