package com.talentmatch.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoResponse {
    private Long id;
    private String nombre;
    private String tipo;
    private String descripcion;
    private String url;
    private Boolean esPrincipal;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
} 