package com.talentmatch.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO para las estadísticas del dashboard del reclutador.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardReclutadorResponse {
    // Información básica del reclutador
    private ReclutadorResponse reclutador;
    
    // Estadísticas generales
    private Integer vacantesActivas;
    private Integer vacantesCerradas;
    private Integer vacantesTotal;
    private Integer candidatosTotal;
    private Integer candidatosAnalizados;
    private Integer contratacionesTotal;
    
    // Estadísticas de rendimiento
    private Integer diasPromedioContratacion;
    private Double tasaConversion;
    
    // Vacantes activas del reclutador
    private List<VacanteResumenResponse> vacantesRecientes;
    
    // Candidatos destacados (mejores matches según IA)
    private List<CandidatoTopResponse> candidatosDestacados;
    
    // Análisis de habilidades más demandadas
    private List<Map<String, Object>> habilidadesDestacadas;
    
    // Insights generados por IA
    private List<String> insightsIA;
} 