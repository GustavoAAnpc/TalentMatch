package com.talentmatch.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.CambioEstadoPostulacionRequest;
import com.talentmatch.dto.request.CreacionPostulacionRequest;
import com.talentmatch.dto.response.EmparejamientoResponse;
import com.talentmatch.dto.response.PostulacionDetalleResponse;
import com.talentmatch.dto.response.PostulacionResumenResponse;
import com.talentmatch.model.enums.EstadoPostulacion;
import com.talentmatch.service.IAService;
import com.talentmatch.service.PostulacionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de postulaciones.
 */
@RestController
@RequestMapping("/api/postulaciones")
@RequiredArgsConstructor
public class PostulacionController {

    private final PostulacionService postulacionService;
    private final IAService iaService;

    /**
     * Crea una nueva postulación.
     * 
     * @param candidatoId ID del candidato que postula
     * @param request DTO con la información de la postulación
     * @return ResponseEntity con el DTO de la postulación creada
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PostulacionDetalleResponse> crearPostulacion(
            @RequestParam Long candidatoId,
            @Valid @RequestBody CreacionPostulacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postulacionService.crear(candidatoId, request));
    }

    /**
     * Obtiene una postulación por su ID.
     * 
     * @param id ID de la postulación a buscar
     * @return ResponseEntity con el DTO de la postulación
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<PostulacionDetalleResponse> obtenerPostulacionPorId(@PathVariable Long id) {
        return ResponseEntity.ok(postulacionService.buscarPorId(id));
    }

    /**
     * Cambia el estado de una postulación.
     * 
     * @param id ID de la postulación
     * @param reclutadorId ID del reclutador que cambia el estado
     * @param request DTO con la información del cambio de estado
     * @return ResponseEntity con el DTO de la postulación actualizada
     */
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<PostulacionDetalleResponse> cambiarEstadoPostulacion(
            @PathVariable Long id,
            @RequestParam Long reclutadorId,
            @Valid @RequestBody CambioEstadoPostulacionRequest request) {
        return ResponseEntity.ok(postulacionService.cambiarEstado(id, reclutadorId, request));
    }

    /**
     * Sube un documento adicional a una postulación.
     * 
     * @param id ID de la postulación
     * @param candidatoId ID del candidato que sube el documento
     * @param documento Archivo a subir
     * @param nombreDocumento Nombre descriptivo del documento
     * @return ResponseEntity con la URL del documento subido
     */
    @PostMapping("/{id}/documentos")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> subirDocumento(
            @PathVariable Long id,
            @RequestParam Long candidatoId,
            @RequestParam("archivo") MultipartFile documento,
            @RequestParam String nombreDocumento) {
        return ResponseEntity.ok(postulacionService.subirDocumento(id, candidatoId, documento, nombreDocumento));
    }

    /**
     * Lista las postulaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de postulaciones
     */
    @GetMapping("/candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PostulacionResumenResponse>> listarPostulacionesPorCandidato(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(postulacionService.buscarPorCandidato(candidatoId));
    }

    /**
     * Lista las postulaciones a una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @param reclutadorId ID del reclutador
     * @return ResponseEntity con la lista de postulaciones
     */
    @GetMapping("/vacante/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PostulacionResumenResponse>> listarPostulacionesPorVacante(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(postulacionService.buscarPorVacante(vacanteId));
    }

    /**
     * Lista las postulaciones por estado.
     * 
     * @param estado Estado de las postulaciones a buscar
     * @return ResponseEntity con la lista de postulaciones
     */
    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PostulacionResumenResponse>> listarPostulacionesPorEstado(
            @PathVariable EstadoPostulacion estado) {
        return ResponseEntity.ok(postulacionService.buscarPorEstado(estado));
    }

    /**
     * Lista las postulaciones a una vacante por estado.
     * 
     * @param vacanteId ID de la vacante
     * @param estado Estado de las postulaciones
     * @param reclutadorId ID del reclutador
     * @return ResponseEntity con la lista de postulaciones
     */
    @GetMapping("/vacante/{vacanteId}/estado/{estado}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PostulacionResumenResponse>> listarPostulacionesPorVacanteYEstado(
            @PathVariable Long vacanteId,
            @PathVariable EstadoPostulacion estado,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(postulacionService.buscarPorVacanteYEstado(vacanteId, estado));
    }

    /**
     * Lista las postulaciones de un candidato por estado.
     * 
     * @param candidatoId ID del candidato
     * @param estado Estado de las postulaciones
     * @return ResponseEntity con la lista de postulaciones
     */
    @GetMapping("/candidato/{candidatoId}/estado/{estado}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<PostulacionResumenResponse>> listarPostulacionesPorCandidatoYEstado(
            @PathVariable Long candidatoId,
            @PathVariable EstadoPostulacion estado) {
        return ResponseEntity.ok(postulacionService.buscarPorCandidatoYEstado(candidatoId, estado));
    }

    /**
     * Verifica si un candidato ya ha postulado a una vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado de la verificación
     */
    @GetMapping("/verificar")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Boolean> verificarPostulacion(
            @RequestParam Long candidatoId,
            @RequestParam Long vacanteId) {
        return ResponseEntity.ok(postulacionService.existePostulacion(candidatoId, vacanteId));
    }
    
    /**
     * Obtiene la puntuación de compatibilidad entre candidato y vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado del emparejamiento
     */
    @GetMapping("/compatibilidad")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<EmparejamientoResponse> obtenerCompatibilidad(
            @RequestParam Long candidatoId,
            @RequestParam Long vacanteId) {
        return ResponseEntity.ok(iaService.calcularEmparejamiento(candidatoId, vacanteId));
    }
} 