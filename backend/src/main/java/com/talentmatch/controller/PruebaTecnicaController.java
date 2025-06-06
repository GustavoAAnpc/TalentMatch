package com.talentmatch.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.talentmatch.dto.request.CreacionEvaluacionRequest;
import com.talentmatch.dto.request.CreacionPreguntaRequest;
import com.talentmatch.dto.request.CreacionPruebaTecnicaRequest;
import com.talentmatch.dto.request.CreacionRespuestaRequest;
import com.talentmatch.dto.response.EvaluacionResponse;
import com.talentmatch.dto.response.PreguntaResponse;
import com.talentmatch.dto.response.PruebaTecnicaDetalleResponse;
import com.talentmatch.dto.response.PruebaTecnicaResumenResponse;
import com.talentmatch.dto.response.RespuestaResponse;
import com.talentmatch.service.IntegracionIAService;
import com.talentmatch.service.PruebaTecnicaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de pruebas técnicas.
 */
@RestController
@RequestMapping("/api/pruebas-tecnicas")
@RequiredArgsConstructor
public class PruebaTecnicaController {

    private final PruebaTecnicaService pruebaTecnicaService;
    private final IntegracionIAService integracionIAService;

    /**
     * Crea una nueva prueba técnica.
     * 
     * @param reclutadorId ID del reclutador que crea la prueba
     * @param request DTO con la información de la prueba
     * @return ResponseEntity con el DTO de la prueba creada
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PruebaTecnicaDetalleResponse> crearPruebaTecnica(
            @RequestParam Long reclutadorId,
            @Valid @RequestBody CreacionPruebaTecnicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pruebaTecnicaService.crear(reclutadorId, request));
    }

    /**
     * Genera una prueba técnica con IA basada en una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador
     * @param titulo Título de la prueba
     * @param descripcion Descripción de la prueba
     * @param numPreguntas Número de preguntas a generar
     * @return ResponseEntity con el DTO de la prueba generada
     */
    @PostMapping("/generar-con-ia")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PruebaTecnicaDetalleResponse> generarPruebaTecnicaConIA(
            @RequestParam Long vacanteId,
            @RequestParam Long reclutadorId,
            @RequestParam String titulo,
            @RequestParam String descripcion,
            @RequestParam int numPreguntas) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pruebaTecnicaService.generarPruebaConIA(vacanteId, reclutadorId, titulo, descripcion, numPreguntas));
    }

    /**
     * Obtiene una prueba técnica por su ID.
     * 
     * @param id ID de la prueba técnica
     * @return ResponseEntity con el DTO de la prueba
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<PruebaTecnicaDetalleResponse> obtenerPruebaTecnicaPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pruebaTecnicaService.buscarPorId(id));
    }

    /**
     * Asigna una prueba técnica a una postulación.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param postulacionId ID de la postulación
     * @param reclutadorId ID del reclutador
     * @return ResponseEntity con el DTO de la prueba actualizada
     */
    @PostMapping("/{pruebaTecnicaId}/asignar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PruebaTecnicaDetalleResponse> asignarPruebaAPostulacion(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long postulacionId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(pruebaTecnicaService.asignarAPostulacion(pruebaTecnicaId, postulacionId, reclutadorId));
    }

    /**
     * Crea una pregunta en una prueba técnica.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param reclutadorId ID del reclutador
     * @param request DTO con la información de la pregunta
     * @return ResponseEntity con el DTO de la pregunta creada
     */
    @PostMapping("/{pruebaTecnicaId}/preguntas")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PreguntaResponse> crearPregunta(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long reclutadorId,
            @Valid @RequestBody CreacionPreguntaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pruebaTecnicaService.crearPregunta(pruebaTecnicaId, reclutadorId, request));
    }

    /**
     * Responde una pregunta de prueba técnica.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param preguntaId ID de la pregunta
     * @param candidatoId ID del candidato
     * @param request DTO con la respuesta
     * @return ResponseEntity con el DTO de la respuesta creada
     */
    @PostMapping("/{pruebaTecnicaId}/preguntas/{preguntaId}/respuestas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<RespuestaResponse> responderPregunta(
            @PathVariable Long pruebaTecnicaId,
            @PathVariable Long preguntaId,
            @RequestParam Long candidatoId,
            @Valid @RequestBody CreacionRespuestaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pruebaTecnicaService.crearRespuesta(pruebaTecnicaId, preguntaId, candidatoId, request));
    }

    /**
     * Evalúa una prueba técnica completada.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param reclutadorId ID del reclutador
     * @param request DTO con la información de la evaluación
     * @return ResponseEntity con el DTO de la evaluación creada
     */
    @PostMapping("/{pruebaTecnicaId}/evaluar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<EvaluacionResponse> evaluarPruebaTecnica(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long reclutadorId,
            @Valid @RequestBody CreacionEvaluacionRequest request) {
        return ResponseEntity.ok(pruebaTecnicaService.evaluarPrueba(pruebaTecnicaId, reclutadorId, request));
    }
    
    /**
     * Evalúa automáticamente una prueba técnica completada usando IA.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param reclutadorId ID del reclutador
     * @return ResponseEntity con el resultado de la evaluación automática
     */
    @PostMapping("/{pruebaTecnicaId}/evaluar-con-ia")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> evaluarPruebaTecnicaConIA(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.evaluarRespuestasPruebaTecnica(pruebaTecnicaId));
    }

    /**
     * Marca una prueba técnica como completada.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param candidatoId ID del candidato
     * @return ResponseEntity con el DTO de la prueba actualizada
     */
    @PostMapping("/{pruebaTecnicaId}/completar")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PruebaTecnicaDetalleResponse> completarPruebaTecnica(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long candidatoId) {
        return ResponseEntity.ok(pruebaTecnicaService.marcarComoCompletada(pruebaTecnicaId, candidatoId));
    }

    /**
     * Busca pruebas técnicas por reclutador.
     * 
     * @param reclutadorId ID del reclutador
     * @return ResponseEntity con la lista de pruebas
     */
    @GetMapping("/reclutador/{reclutadorId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PruebaTecnicaResumenResponse>> buscarPruebasPorReclutador(
            @PathVariable Long reclutadorId) {
        return ResponseEntity.ok(pruebaTecnicaService.buscarPorReclutador(reclutadorId));
    }

    /**
     * Busca pruebas técnicas por candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de pruebas
     */
    @GetMapping("/candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PruebaTecnicaResumenResponse>> buscarPruebasPorCandidato(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(pruebaTecnicaService.buscarPorCandidato(candidatoId));
    }

    /**
     * Busca pruebas técnicas por vacante.
     * 
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con la lista de pruebas
     */
    @GetMapping("/vacante/{vacanteId}")
    public ResponseEntity<List<PruebaTecnicaResumenResponse>> buscarPruebasPorVacante(
            @PathVariable Long vacanteId) {
        return ResponseEntity.ok(pruebaTecnicaService.buscarPorVacante(vacanteId));
    }

    /**
     * Busca pruebas técnicas pendientes por candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de pruebas pendientes
     */
    @GetMapping("/candidato/{candidatoId}/pendientes")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PruebaTecnicaResumenResponse>> buscarPruebasPendientesPorCandidato(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(pruebaTecnicaService.buscarPendientesPorCandidato(candidatoId));
    }
    
    /**
     * Genera preguntas para una prueba técnica basada en una vacante utilizando IA.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador
     * @param numPreguntas Número de preguntas a generar
     * @return ResponseEntity con la lista de preguntas generadas
     */
    @GetMapping("/generar-preguntas")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<String>> generarPreguntasConIA(
            @RequestParam Long vacanteId,
            @RequestParam Long reclutadorId,
            @RequestParam(defaultValue = "5") int numPreguntas) {
        return ResponseEntity.ok(pruebaTecnicaService.generarPreguntasConIA(vacanteId, numPreguntas));
    }
} 