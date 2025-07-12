package com.talentmatch.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para mostrar información resumida de los candidatos destacados.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidatoTopResponse {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String urlFoto;
    private String profesion;
    private String ubicacion;
    private List<String> habilidadesPrincipales;
    private Integer aniosExperiencia;
    private Double matchPorcentaje;
    private String insight;
} 