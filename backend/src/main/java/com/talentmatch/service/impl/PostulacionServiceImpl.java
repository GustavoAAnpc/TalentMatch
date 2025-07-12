package com.talentmatch.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.CambioEstadoPostulacionRequest;
import com.talentmatch.dto.request.CreacionPostulacionRequest;
import com.talentmatch.dto.response.PostulacionDetalleResponse;
import com.talentmatch.dto.response.PostulacionResumenResponse;
import com.talentmatch.exception.EntidadDuplicadaException;
import com.talentmatch.exception.OperacionInvalidaException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.mapper.PostulacionMapper;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.enums.EstadoPostulacion;
import com.talentmatch.repository.PostulacionRepository;
import com.talentmatch.service.CandidatoService;
import com.talentmatch.service.IntegracionIAService;
import com.talentmatch.service.PostulacionService;
import com.talentmatch.service.StorageService;
import com.talentmatch.service.VacanteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de postulaciones.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class PostulacionServiceImpl implements PostulacionService {

    private final PostulacionRepository postulacionRepository;
    private final CandidatoService candidatoService;
    private final VacanteService vacanteService;
    private final PostulacionMapper postulacionMapper;
    private final StorageService storageService;
    private final IntegracionIAService integracionIAService;

    @Override
    @Transactional
    public PostulacionDetalleResponse crear(Long candidatoId, CreacionPostulacionRequest request) {
        // Validar que no exista una postulación previa del candidato a la misma vacante
        if (existePostulacion(candidatoId, request.getVacanteId())) {
            throw new EntidadDuplicadaException("Ya existe una postulación del candidato para esta vacante");
        }
        
        // Buscar el candidato y la vacante
        Candidato candidato = candidatoService.buscarCandidatoPorId(candidatoId);
        Vacante vacante = vacanteService.buscarVacantePorId(request.getVacanteId());
        
        // Validar que la vacante esté activa
        if (!vacante.estaActiva()) {
            throw new OperacionInvalidaException("No se puede postular a una vacante que no está activa");
        }
        
        // Crear la postulación
        Postulacion postulacion = new Postulacion();
        postulacion.setCandidato(candidato);
        postulacion.setVacante(vacante);
        postulacion.setEstado(EstadoPostulacion.APLICADA);
        postulacion.setCartaPresentacion(request.getCartaPresentacion());
        postulacion.setFechaCreacion(LocalDateTime.now());
        
        // Calcular el puntaje de compatibilidad utilizando IA
        try {
            // Solo asignar puntuación si el candidato tiene currículo
            if (candidato.getUrlCurriculum() != null && !candidato.getUrlCurriculum().isEmpty()) {
                var compatibilidad = integracionIAService.evaluarCompatibilidad(candidatoId, request.getVacanteId());
                Integer puntuacion = (Integer) compatibilidad.getOrDefault("porcentaje", 0);
                postulacion.setPuntuacionMatch(puntuacion);
                log.info("Puntuación de compatibilidad calculada para postulación: {}", puntuacion);
            }
        } catch (Exception e) {
            log.warn("Error al calcular compatibilidad IA: {}", e.getMessage());
            // Establecer puntuación por defecto si falla el análisis
            postulacion.setPuntuacionMatch(0);
        }
        
        // Guardar la postulación
        postulacion = postulacionRepository.save(postulacion);
        
        log.info("Postulación creada con ID: {} para candidato ID: {} a vacante ID: {}", 
                postulacion.getId(), candidatoId, request.getVacanteId());
        
        return postulacionMapper.toPostulacionDetalleResponse(postulacion);
    }

    @Override
    public PostulacionDetalleResponse buscarPorId(Long id) {
        Postulacion postulacion = buscarPostulacionPorId(id);
        return postulacionMapper.toPostulacionDetalleResponse(postulacion);
    }

    @Override
    @Transactional
    public PostulacionDetalleResponse cambiarEstado(Long id, Long reclutadorId, CambioEstadoPostulacionRequest request) {
        Postulacion postulacion = buscarPostulacionPorId(id);
        
        // Validar que la vacante pertenece al reclutador
        if (!postulacion.getVacante().getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta postulación");
        }
        
        // Validar que el cambio de estado sea válido
        if (!postulacion.esTransicionEstadoValida(request.getNuevoEstado())) {
            throw new OperacionInvalidaException("Transición de estado no válida: " + 
                    postulacion.getEstado() + " -> " + request.getNuevoEstado());
        }
        
        // Cambiar el estado
        postulacion.setEstado(request.getNuevoEstado());
        postulacion.setComentariosReclutador(request.getComentarios());
        postulacion.setFechaActualizacion(LocalDateTime.now());
        
        // Si se programa una entrevista, guardar la fecha
        if (request.getNuevoEstado() == EstadoPostulacion.ENTREVISTA && request.getFechaEntrevista() != null) {
            postulacion.setFechaEntrevista(request.getFechaEntrevista());
        }
        
        postulacion = postulacionRepository.save(postulacion);
        
        log.info("Estado de postulación ID: {} cambiado a: {}", id, request.getNuevoEstado());
        
        return postulacionMapper.toPostulacionDetalleResponse(postulacion);
    }

    @Override
    @Transactional
    public String subirDocumento(Long id, Long candidatoId, MultipartFile documento, String nombreDocumento) {
        Postulacion postulacion = buscarPostulacionPorId(id);
        
        // Validar que el candidato sea el dueño de la postulación
        if (!postulacion.getCandidato().getId().equals(candidatoId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta postulación");
        }
        
        // Validar tipo de archivo
        String contentType = documento.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") && !contentType.contains("msword") && 
                !contentType.contains("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            throw new OperacionInvalidaException("El archivo debe ser un PDF o un documento de Word");
        }
        
        // Guardar el documento
        String ruta = "postulaciones/" + id;
        String archivoNombre = System.currentTimeMillis() + "_" + 
                documento.getOriginalFilename().replaceAll("\\s", "_");
        
        String url = storageService.guardarArchivo(documento, ruta, archivoNombre);
        
        log.info("Documento '{}' subido para postulación ID: {}", nombreDocumento, id);
        
        return url;
    }

    @Override
    public List<PostulacionResumenResponse> buscarPorCandidato(Long candidatoId) {
        return postulacionRepository.findByCandidatoId(candidatoId).stream()
                .map(postulacionMapper::toPostulacionResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostulacionResumenResponse> buscarPorVacante(Long vacanteId) {
        return postulacionRepository.findByVacanteId(vacanteId).stream()
                .map(postulacionMapper::toPostulacionResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostulacionResumenResponse> buscarPorEstado(EstadoPostulacion estado) {
        return postulacionRepository.findByEstado(estado).stream()
                .map(postulacionMapper::toPostulacionResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostulacionResumenResponse> buscarPorVacanteYEstado(Long vacanteId, EstadoPostulacion estado) {
        return postulacionRepository.findByVacanteIdAndEstado(vacanteId, estado).stream()
                .map(postulacionMapper::toPostulacionResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PostulacionResumenResponse> buscarPorCandidatoYEstado(Long candidatoId, EstadoPostulacion estado) {
        return postulacionRepository.findByCandidatoIdAndEstado(candidatoId, estado).stream()
                .map(postulacionMapper::toPostulacionResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existePostulacion(Long candidatoId, Long vacanteId) {
        return postulacionRepository.existsByCandidatoIdAndVacanteId(candidatoId, vacanteId);
    }

    @Override
    public Postulacion buscarPostulacionPorId(Long id) {
        return postulacionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró postulación con ID: " + id));
    }

    @Override
    @Transactional
    public PostulacionDetalleResponse actualizarCartaPresentacion(Long id, String cartaPresentacion) {
        Postulacion postulacion = buscarPostulacionPorId(id);
        
        // Validar que la carta de presentación no sea nula
        if (cartaPresentacion == null) {
            throw new OperacionInvalidaException("La carta de presentación no puede ser nula");
        }
        
        // Actualizar la carta de presentación
        postulacion.setCartaPresentacion(cartaPresentacion);
        postulacion.setFechaActualizacion(LocalDateTime.now());
        
        // Guardar la postulación actualizada
        postulacion = postulacionRepository.save(postulacion);
        
        log.info("Carta de presentación actualizada para postulación ID: {}", id);
        
        return postulacionMapper.toPostulacionDetalleResponse(postulacion);
    }
} 