package com.talentmatch.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.talentmatch.service.ExperienciaLaboralService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la gestión de experiencia laboral de candidatos.
 */
@RestController
@RequestMapping("/api/experiencias-laborales")
@RequiredArgsConstructor
public class ExperienciaLaboralController {

    private final ExperienciaLaboralService experienciaLaboralService;

    /**
     * Obtiene todas las experiencias laborales de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de experiencias laborales
     */
    @GetMapping("/candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerExperienciasLaborales(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(experienciaLaboralService.listarPorCandidato(candidatoId));
    }

    /**
     * Obtiene una experiencia laboral específica.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @return Experiencia laboral encontrada
     */
    @GetMapping("/candidato/{candidatoId}/{experienciaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> obtenerExperienciaLaboral(
            @PathVariable Long candidatoId, 
            @PathVariable Long experienciaId) {
        return ResponseEntity.ok(experienciaLaboralService.buscarPorId(candidatoId, experienciaId));
    }

    /**
     * Crea una nueva experiencia laboral para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la experiencia laboral
     * @return Experiencia laboral creada
     */
    @PostMapping("/candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> crearExperienciaLaboral(
            @PathVariable Long candidatoId,
            @Valid @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(experienciaLaboralService.crear(candidatoId, request));
    }

    /**
     * Actualiza una experiencia laboral existente.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @param request Datos actualizados de la experiencia laboral
     * @return Experiencia laboral actualizada
     */
    @PutMapping("/candidato/{candidatoId}/{experienciaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarExperienciaLaboral(
            @PathVariable Long candidatoId,
            @PathVariable Long experienciaId,
            @Valid @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(experienciaLaboralService.actualizar(candidatoId, experienciaId, request));
    }

    /**
     * Elimina una experiencia laboral.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @return Respuesta vacía con estado 204
     */
    @DeleteMapping("/candidato/{candidatoId}/{experienciaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarExperienciaLaboral(
            @PathVariable Long candidatoId, 
            @PathVariable Long experienciaId) {
        experienciaLaboralService.eliminar(candidatoId, experienciaId);
        return ResponseEntity.noContent().build();
    }
} 