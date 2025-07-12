package com.talentmatch.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.dto.request.ActualizacionNotificacionRequest;
import com.talentmatch.dto.response.NotificacionResponse;
import com.talentmatch.mapper.NotificacionMapper;
import com.talentmatch.model.entity.Notificacion;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.enums.EstadoPostulacion;
import com.talentmatch.model.enums.TipoNotificacion;
import com.talentmatch.repository.NotificacionRepository;
import com.talentmatch.repository.UsuarioRepository;
import com.talentmatch.service.NotificacionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de notificaciones.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class NotificacionServiceImpl implements NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionMapper notificacionMapper;

    @Override
    public List<NotificacionResponse> buscarPorUsuario(Long usuarioId) {
        log.info("Buscando notificaciones para el usuario ID: {}", usuarioId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Notificacion> notificaciones = notificacionRepository.findByUsuarioOrderByFechaCreacionDesc(usuario);
        return notificaciones.stream()
                .map(notificacionMapper::toNotificacionResponse)
                .toList();
    }

    @Override
    public List<NotificacionResponse> buscarNoLeidasPorUsuario(Long usuarioId) {
        log.info("Buscando notificaciones no leídas para el usuario ID: {}", usuarioId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Notificacion> notificaciones = notificacionRepository.findByUsuarioAndLeida(usuario, false);
        return notificaciones.stream()
                .map(notificacionMapper::toNotificacionResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificacionResponse marcarComoLeida(Long id, Long usuarioId) {
        log.info("Marcando notificación ID: {} como leída para usuario ID: {}", id, usuarioId);
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        // Verificar que la notificación pertenece al usuario
        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("No autorizado para marcar esta notificación");
        }

        notificacion.marcarComoLeida();
        Notificacion notificacionGuardada = notificacionRepository.save(notificacion);
        return notificacionMapper.toNotificacionResponse(notificacionGuardada);
    }

    @Override
    @Transactional
    public int marcarTodasComoLeidas(Long usuarioId) {
        log.info("Marcando todas las notificaciones como leídas para usuario ID: {}", usuarioId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Notificacion> notificacionesNoLeidas = notificacionRepository.findByUsuarioAndLeida(usuario, false);

        notificacionesNoLeidas.forEach(Notificacion::marcarComoLeida);
        notificacionRepository.saveAll(notificacionesNoLeidas);

        return notificacionesNoLeidas.size();
    }

    @Override
    @Transactional
    public NotificacionResponse actualizar(Long id, Long usuarioId, ActualizacionNotificacionRequest request) {
        log.info("Actualizando notificación ID: {} para usuario ID: {}", id, usuarioId);
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        // Verificar que la notificación pertenece al usuario
        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("No autorizado para actualizar esta notificación");
        }

        notificacionMapper.marcarComoLeida(request, notificacion);
        Notificacion notificacionGuardada = notificacionRepository.save(notificacion);
        return notificacionMapper.toNotificacionResponse(notificacionGuardada);
    }

    @Override
    @Transactional
    public boolean eliminar(Long id, Long usuarioId) {
        log.info("Eliminando notificación ID: {} para usuario ID: {}", id, usuarioId);
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        // Verificar que la notificación pertenece al usuario
        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("No autorizado para eliminar esta notificación");
        }

        notificacionRepository.delete(notificacion);
        return true;
    }

    @Override
    @Transactional
    public void notificarNuevaPostulacion(Postulacion postulacion) {
        log.info("Notificando nueva postulación ID: {} al reclutador", postulacion.getId());

        String titulo = "Nueva postulación recibida";
        String contenido = String.format("Has recibido una nueva postulación para la vacante '%s' de %s %s",
                postulacion.getVacante().getTitulo(),
                postulacion.getCandidato().getNombre(),
                postulacion.getCandidato().getApellido());

        Notificacion notificacion = notificacionMapper.crearNotificacion(
                postulacion.getVacante().getReclutador(),
                titulo,
                contenido,
                TipoNotificacion.NUEVA_POSTULACION,
                postulacion.getId(),
                "POSTULACION");

        notificacionRepository.save(notificacion);
    }

    @Override
    @Transactional
    public void notificarCambioEstadoPostulacion(Postulacion postulacion, EstadoPostulacion estadoAnterior) {
        log.info("Notificando cambio de estado de postulación ID: {} de {} a {}",
                postulacion.getId(), estadoAnterior, postulacion.getEstado());

        String titulo = "Actualización de tu postulación";
        String contenido = String.format("Tu postulación para '%s' ha cambiado de estado de %s a %s",
                postulacion.getVacante().getTitulo(),
                estadoAnterior.name(),
                postulacion.getEstado().name());

        Notificacion notificacion = notificacionMapper.crearNotificacion(
                postulacion.getCandidato(),
                titulo,
                contenido,
                TipoNotificacion.CAMBIO_ESTADO_POSTULACION,
                postulacion.getId(),
                "POSTULACION");

        notificacionRepository.save(notificacion);
    }

    @Override
    @Transactional
    public void notificarNuevaVacante(Vacante vacante) {
        log.info("Notificando nueva vacante ID: {} a candidatos", vacante.getId());

        // En una implementación real, aquí se buscarían candidatos que coincidan con el
        // perfil
        // Por ahora, no implementamos esta funcionalidad
        log.warn("Notificación de nueva vacante no implementada completamente");
    }

    @Override
    @Transactional
    public void notificarAsignacionPruebaTecnica(Postulacion postulacion) {
        log.info("Notificando asignación de prueba técnica para postulación ID: {}", postulacion.getId());

        String titulo = "Prueba técnica asignada";
        String contenido = String.format("Se te ha asignado una prueba técnica para la vacante '%s'. " +
                "Revisa tu dashboard para más detalles.",
                postulacion.getVacante().getTitulo());

        Notificacion notificacion = notificacionMapper.crearNotificacion(
                postulacion.getCandidato(),
                titulo,
                contenido,
                TipoNotificacion.PRUEBA_DISPONIBLE,
                postulacion.getId(),
                "POSTULACION");

        notificacionRepository.save(notificacion);
    }

    @Override
    @Transactional
    public void notificarFinalizacionPruebaTecnica(Postulacion postulacion) {
        log.info("Notificando finalización de prueba técnica para postulación ID: {}", postulacion.getId());

        String titulo = "Prueba técnica completada";
        String contenido = String.format("La prueba técnica para la vacante '%s' ha sido completada. " +
                "Revisa los resultados en tu dashboard.",
                postulacion.getVacante().getTitulo());

        Notificacion notificacion = notificacionMapper.crearNotificacion(
                postulacion.getVacante().getReclutador(),
                titulo,
                contenido,
                TipoNotificacion.EVALUACION_COMPLETADA,
                postulacion.getId(),
                "POSTULACION");

        notificacionRepository.save(notificacion);
    }
}