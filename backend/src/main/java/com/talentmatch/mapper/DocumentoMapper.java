package com.talentmatch.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.talentmatch.dto.response.DocumentoResponse;
import com.talentmatch.model.entity.Documento;

@Mapper(componentModel = "spring")
public interface DocumentoMapper {
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "nombre", source = "nombre")
    @Mapping(target = "tipo", source = "tipo")
    @Mapping(target = "descripcion", source = "descripcion")
    @Mapping(target = "url", source = "url")
    @Mapping(target = "esPrincipal", source = "esPrincipal")
    @Mapping(target = "fechaCreacion", source = "fechaCreacion")
    @Mapping(target = "fechaActualizacion", source = "fechaActualizacion")
    DocumentoResponse toDocumentoResponse(Documento documento);
} 