package com.talentmatch.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * DTO para solicitudes de actualización de candidatos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ActualizacionCandidatoRequest {

    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String nombre;

    @Size(max = 100, message = "El apellido no puede exceder los 100 caracteres")
    private String apellido;

    @Size(max = 20, message = "El teléfono no puede exceder los 20 caracteres")
    private String telefono;

    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate fechaNacimiento;

    @Size(max = 100, message = "El título profesional no puede exceder los 100 caracteres")
    private String tituloProfesional;

    @Size(max = 2000, message = "El resumen del perfil no puede exceder los 2000 caracteres")
    private String resumenPerfil;

    @Size(max = 100, message = "La ubicación no puede exceder los 100 caracteres")
    private String ubicacion;

    @Size(max = 255, message = "La URL de LinkedIn no puede exceder los 255 caracteres")
    private String linkedinUrl;

    @Size(max = 255, message = "La URL de GitHub no puede exceder los 255 caracteres")
    private String githubUrl;

    @Size(max = 255, message = "La URL del portfolio no puede exceder los 255 caracteres")
    private String portfolioUrl;

    @Size(max = 1000, message = "Las habilidades principales no pueden exceder los 1000 caracteres")
    private String habilidadesPrincipales;

    private Integer experienciaAnios;

    private Boolean disponibilidadInmediata;
}
