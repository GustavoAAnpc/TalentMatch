package com.talentmatch.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO para respuestas con información de experiencia laboral de candidatos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class ExperienciaLaboralResponse {
    
    private Long id;
    private Long candidatoId;
    private String position;
    private String company;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
} 