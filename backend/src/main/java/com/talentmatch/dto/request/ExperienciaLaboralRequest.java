package com.talentmatch.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para solicitudes de creación o actualización de experiencia laboral.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienciaLaboralRequest {
    
    @NotBlank(message = "El puesto o cargo es obligatorio")
    private String position;
    
    @NotBlank(message = "La empresa es obligatoria")
    private String company;
    
    private String location;
    
    // Fechas como String para facilitar la integración con el frontend
    private String startDate;
    
    private String endDate;
    
    private String description;
} 