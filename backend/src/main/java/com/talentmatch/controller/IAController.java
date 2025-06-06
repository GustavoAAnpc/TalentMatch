package com.talentmatch.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.AnalisisPerfilRequest;
import com.talentmatch.dto.response.AnalisisPerfilResponse;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.dto.response.EmparejamientoResponse;
import com.talentmatch.dto.response.VacanteResumenResponse;
import com.talentmatch.service.IAService;
import com.talentmatch.service.IntegracionIAService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el servicio de IA.
 */
@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IAController {

    private final IAService iaService;
    private final IntegracionIAService integracionIAService;

    /**
     * Analiza el CV de un candidato.
     * 
     * @param curriculum Archivo del CV a analizar
     * @return ResponseEntity con el mapa de resultados del análisis
     */
    @PostMapping("/analizar-cv")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> analizarCurriculum(
            @RequestParam("archivo") MultipartFile curriculum) {
        return ResponseEntity.ok(integracionIAService.analizarCurriculum(curriculum));
    }

    /**
     * Calcula el emparejamiento entre un candidato y una vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado del emparejamiento
     */
    @GetMapping("/emparejamiento")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<EmparejamientoResponse> calcularEmparejamiento(
            @RequestParam Long candidatoId,
            @RequestParam Long vacanteId) {
        return ResponseEntity.ok(iaService.calcularEmparejamiento(candidatoId, vacanteId));
    }

    /**
     * Recomienda vacantes para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param limite Número máximo de vacantes a recomendar
     * @return ResponseEntity con la lista de vacantes recomendadas
     */
    @GetMapping("/candidatos/{candidatoId}/vacantes-recomendadas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<VacanteResumenResponse>> recomendarVacantes(
            @PathVariable Long candidatoId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.recomendarVacantes(candidatoId, limite));
    }

    /**
     * Recomienda candidatos para una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador que solicita la recomendación
     * @param limite Número máximo de candidatos a recomendar
     * @return ResponseEntity con la lista de candidatos recomendados
     */
    @GetMapping("/vacantes/{vacanteId}/candidatos-recomendados")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<CandidatoResponse>> recomendarCandidatos(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.recomendarCandidatos(vacanteId, limite));
    }

    /**
     * Genera preguntas para una prueba técnica basada en una vacante.
     * 
     * @param tituloVacante Título de la vacante
     * @param descripcionVacante Descripción de la vacante
     * @param habilidadesRequeridas Habilidades requeridas
     * @param numPreguntas Número de preguntas a generar
     * @return ResponseEntity con la lista de preguntas generadas
     */
    @GetMapping("/generar-preguntas")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<List<String>> generarPreguntasPruebaTecnica(
            @RequestParam String tituloVacante,
            @RequestParam String descripcionVacante,
            @RequestParam String habilidadesRequeridas,
            @RequestParam(defaultValue = "5") int numPreguntas) {
        return ResponseEntity.ok(integracionIAService.generarPreguntasPruebaTecnica(
                tituloVacante, descripcionVacante, habilidadesRequeridas, numPreguntas));
    }

    /**
     * Evalúa las respuestas de una prueba técnica.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param reclutadorId ID del reclutador que solicita la evaluación
     * @return ResponseEntity con el mapa de resultados de la evaluación
     */
    @GetMapping("/evaluar-respuestas/{pruebaTecnicaId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> evaluarRespuestasPruebaTecnica(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.evaluarRespuestasPruebaTecnica(pruebaTecnicaId));
    }

    /**
     * Genera retroalimentación para un candidato sobre su postulación.
     * 
     * @param postulacionId ID de la postulación
     * @param reclutadorId ID del reclutador que solicita la retroalimentación
     * @return ResponseEntity con la retroalimentación generada
     */
    @GetMapping("/generar-retroalimentacion/{postulacionId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> generarRetroalimentacion(
            @PathVariable Long postulacionId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.generarRetroalimentacion(postulacionId));
    }

    /**
     * Sugiere mejoras para el perfil de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de sugerencias
     */
    @GetMapping("/sugerir-mejoras-perfil/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<String>> sugerirMejorasPerfil(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(integracionIAService.sugerirMejorasPerfil(candidatoId));
    }

    /**
     * Analiza el perfil de un candidato y genera recomendaciones.
     * 
     * @param request DTO con la información para el análisis
     * @return ResponseEntity con el resultado del análisis
     */
    @PostMapping("/analizar-perfil")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<AnalisisPerfilResponse> analizarPerfil(
            @Valid @RequestBody AnalisisPerfilRequest request) {
        return ResponseEntity.ok(iaService.analizarPerfil(request));
    }

    /**
     * Genera una descripción optimizada para una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador que solicita la descripción
     * @return ResponseEntity con la descripción generada
     */
    @GetMapping("/generar-descripcion-vacante/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> generarDescripcionVacante(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(iaService.generarDescripcionVacante(vacanteId));
    }
    
    /**
     * Genera un ranking de candidatos para una vacante específica mediante IA.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador que solicita el ranking
     * @return ResponseEntity con la lista de resultados del ranking
     */
    @GetMapping("/ranking-candidatos/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> generarRankingCandidatos(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.generarRankingCandidatos(vacanteId));
    }

    /**
     * Analiza la compatibilidad entre todos los candidatos postulados a una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador que solicita el análisis
     * @return ResponseEntity con el mapa de análisis de candidatos
     */
    @GetMapping("/analisis-candidatos-vacante/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> analizarCandidatosPostulados(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(iaService.analizarCandidatosPostulados(vacanteId));
    }

    /**
     * Obtiene todos los emparejamientos de un candidato con las vacantes disponibles.
     * 
     * @param candidatoId ID del candidato
     * @param limite Número máximo de vacantes a evaluar
     * @return ResponseEntity con la lista de emparejamientos calculados
     */
    @GetMapping("/emparejamientos-candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<EmparejamientoResponse>> obtenerEmparejamientosCandidato(
            @PathVariable Long candidatoId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.calcularEmparejamientosCandidato(candidatoId, limite));
    }
} 