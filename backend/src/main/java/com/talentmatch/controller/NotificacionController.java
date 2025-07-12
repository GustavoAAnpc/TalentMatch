package com.talentmatch.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.talentmatch.dto.request.ActualizacionNotificacionRequest;
import com.talentmatch.dto.response.NotificacionResponse;
import com.talentmatch.service.NotificacionService;

import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de notificaciones.
 */
@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    /**
     * Obtiene todas las notificaciones de un usuario.
     * 
     * @param usuarioId ID del usuario
     * @return ResponseEntity con la lista de notificaciones
     */
    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<NotificacionResponse>> obtenerNotificacionesPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(notificacionService.buscarPorUsuario(usuarioId));
    }

    /**
     * Obtiene las notificaciones no leídas de un usuario.
     * 
     * @param usuarioId ID del usuario
     * @return ResponseEntity con la lista de notificaciones no leídas
     */
    @GetMapping("/usuario/{usuarioId}/no-leidas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<NotificacionResponse>> obtenerNotificacionesNoLeidasPorUsuario(
            @PathVariable Long usuarioId) {
        return ResponseEntity.ok(notificacionService.buscarNoLeidasPorUsuario(usuarioId));
    }

    /**
     * Marca una notificación como leída.
     * 
     * @param id        ID de la notificación
     * @param usuarioId ID del usuario que marca la notificación
     * @return ResponseEntity con la notificación actualizada
     */
    @PutMapping("/{id}/marcar-leida")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<NotificacionResponse> marcarComoLeida(
            @PathVariable Long id,
            @RequestParam Long usuarioId) {
        return ResponseEntity.ok(notificacionService.marcarComoLeida(id, usuarioId));
    }

    /**
     * Marca todas las notificaciones de un usuario como leídas.
     * 
     * @param usuarioId ID del usuario
     * @return ResponseEntity con el número de notificaciones marcadas como leídas
     */
    @PutMapping("/usuario/{usuarioId}/marcar-todas-leidas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Integer> marcarTodasComoLeidas(@PathVariable Long usuarioId) {
        int count = notificacionService.marcarTodasComoLeidas(usuarioId);
        return ResponseEntity.ok(count);
    }

    /**
     * Actualiza una notificación.
     * 
     * @param id        ID de la notificación
     * @param usuarioId ID del usuario que actualiza la notificación
     * @param request   DTO con la información actualizada
     * @return ResponseEntity con la notificación actualizada
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<NotificacionResponse> actualizarNotificacion(
            @PathVariable Long id,
            @RequestParam Long usuarioId,
            ActualizacionNotificacionRequest request) {
        return ResponseEntity.ok(notificacionService.actualizar(id, usuarioId, request));
    }

    /**
     * Elimina una notificación.
     * 
     * @param id        ID de la notificación
     * @param usuarioId ID del usuario que elimina la notificación
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #usuarioId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarNotificacion(
            @PathVariable Long id,
            @RequestParam Long usuarioId) {
        boolean eliminada = notificacionService.eliminar(id, usuarioId);
        if (eliminada) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}