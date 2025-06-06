package com.talentmatch.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.dto.request.CreacionEvaluacionRequest;
import com.talentmatch.dto.request.CreacionPreguntaRequest;
import com.talentmatch.dto.request.CreacionPruebaTecnicaRequest;
import com.talentmatch.dto.request.CreacionRespuestaRequest;
import com.talentmatch.dto.response.EvaluacionResponse;
import com.talentmatch.dto.response.PreguntaResponse;
import com.talentmatch.dto.response.PruebaTecnicaDetalleResponse;
import com.talentmatch.dto.response.PruebaTecnicaResumenResponse;
import com.talentmatch.dto.response.RespuestaResponse;
import com.talentmatch.exception.OperacionInvalidaException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.mapper.PreguntaMapper;
import com.talentmatch.mapper.PruebaTecnicaMapper;
import com.talentmatch.mapper.RespuestaMapper;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Evaluacion;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Pregunta;
import com.talentmatch.model.entity.PruebaTecnica;
import com.talentmatch.model.entity.Reclutador;
import com.talentmatch.model.entity.Respuesta;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.enums.EstadoPostulacion;
import com.talentmatch.repository.EvaluacionRepository;
import com.talentmatch.repository.PreguntaRepository;
import com.talentmatch.repository.PostulacionRepository;
import com.talentmatch.repository.PruebaTecnicaRepository;
import com.talentmatch.repository.RespuestaRepository;
import com.talentmatch.service.IntegracionIAService;
import com.talentmatch.service.PostulacionService;
import com.talentmatch.service.PruebaTecnicaService;
import com.talentmatch.service.ReclutadorService;
import com.talentmatch.service.VacanteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de pruebas técnicas.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class PruebaTecnicaServiceImpl implements PruebaTecnicaService {

    private final PruebaTecnicaRepository pruebaTecnicaRepository;
    private final PreguntaRepository preguntaRepository;
    private final RespuestaRepository respuestaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final PostulacionRepository postulacionRepository;
    private final PruebaTecnicaMapper pruebaTecnicaMapper;
    private final PreguntaMapper preguntaMapper;
    private final RespuestaMapper respuestaMapper;
    private final ReclutadorService reclutadorService;
    private final VacanteService vacanteService;
    private final PostulacionService postulacionService;
    private final IntegracionIAService integracionIAService;

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse crear(Long reclutadorId, CreacionPruebaTecnicaRequest request) {
        // Obtener el reclutador
        Reclutador reclutador = reclutadorService.buscarReclutadorPorId(reclutadorId);
        
        // Obtener la vacante si se proporciona
        Vacante vacante = null;
        if (request.getVacanteId() != null) {
            vacante = vacanteService.buscarVacantePorId(request.getVacanteId());
            
            // Validar que la vacante pertenece al reclutador
            if (!vacante.getReclutador().getId().equals(reclutadorId)) {
                throw new OperacionInvalidaException("No tienes permiso para crear pruebas técnicas para esta vacante");
            }
        }
        
        // Crear la prueba técnica
        PruebaTecnica prueba = new PruebaTecnica();
        prueba.setReclutador(reclutador);
        prueba.setVacante(vacante);
        prueba.setTitulo(request.getTitulo());
        prueba.setDescripcion(request.getDescripcion());
        prueba.setInstrucciones(request.getInstrucciones());
        prueba.setTiempoLimiteMinutos(request.getTiempoLimiteMinutos());
        prueba.setNivelDificultad(request.getNivelDificultad());
        prueba.setTecnologias(request.getTecnologias());
        prueba.setFechaCreacion(LocalDateTime.now());
        prueba.setCompletada(false);
        
        // Guardar la prueba técnica
        prueba = pruebaTecnicaRepository.save(prueba);
        
        log.info("Prueba técnica creada con ID: {} por reclutador ID: {}", prueba.getId(), reclutadorId);
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    public PruebaTecnicaDetalleResponse buscarPorId(Long id) {
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(id);
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse asignarAPostulacion(Long pruebaTecnicaId, Long postulacionId, Long reclutadorId) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Validar que la prueba pertenece al reclutador
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para asignar esta prueba técnica");
        }
        
        // Obtener la postulación
        Postulacion postulacion = postulacionService.buscarPostulacionPorId(postulacionId);
        
        // Validar que la postulación pertenece a la misma vacante que la prueba técnica (si la prueba tiene vacante)
        if (prueba.getVacante() != null && !postulacion.getVacante().getId().equals(prueba.getVacante().getId())) {
            throw new OperacionInvalidaException("La prueba técnica solo puede asignarse a una postulación de la misma vacante");
        }
        
        // Validar que la postulación está en el estado adecuado
        if (postulacion.getEstado() != EstadoPostulacion.EN_REVISION) {
            throw new OperacionInvalidaException("La postulación debe estar en estado EN_REVISION para asignar una prueba técnica");
        }
        
        // Asignar la postulación a la prueba técnica
        prueba.setPostulacion(postulacion);
        prueba = pruebaTecnicaRepository.save(prueba);
        
        // Actualizar el estado de la postulación
        postulacion.setEstado(EstadoPostulacion.PRUEBA_PENDIENTE);
        postulacion.setFechaActualizacion(LocalDateTime.now());
        
        log.info("Prueba técnica ID: {} asignada a postulación ID: {}", pruebaTecnicaId, postulacionId);
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    @Transactional
    public PreguntaResponse crearPregunta(Long pruebaTecnicaId, Long reclutadorId, CreacionPreguntaRequest request) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Validar que la prueba pertenece al reclutador
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta prueba técnica");
        }
        
        // Crear la pregunta
        Pregunta pregunta = new Pregunta();
        pregunta.setPruebaTecnica(prueba);
        pregunta.setEnunciado(request.getEnunciado());
        pregunta.setTipoPregunta(request.getTipoPregunta());
        pregunta.setOpciones(request.getOpciones());
        pregunta.setRespuestaCorrecta(request.getRespuestaCorrecta());
        pregunta.setPuntuacion(request.getPuntuacion());
        pregunta.setOrden(request.getOrden());
        
        // Guardar la pregunta
        pregunta = preguntaRepository.save(pregunta);
        
        log.info("Pregunta ID: {} agregada a prueba técnica ID: {}", pregunta.getId(), pruebaTecnicaId);
        
        return preguntaMapper.toPreguntaResponse(pregunta);
    }

    @Override
    @Transactional
    public RespuestaResponse crearRespuesta(Long pruebaTecnicaId, Long preguntaId, Long candidatoId, CreacionRespuestaRequest request) {
        // Obtener la pregunta
        Pregunta pregunta = preguntaRepository.findById(preguntaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró pregunta con ID: " + preguntaId));
        
        // Obtener la prueba técnica
        PruebaTecnica prueba = pregunta.getPruebaTecnica();
        
        // Verificar que la pregunta pertenezca a la prueba técnica
        if (!prueba.getId().equals(pruebaTecnicaId)) {
            throw new OperacionInvalidaException("La pregunta no pertenece a la prueba técnica especificada");
        }
        
        // Validar que la postulación pertenece al candidato
        Candidato candidato = prueba.getPostulacion().getCandidato();
        if (!candidato.getId().equals(candidatoId)) {
            throw new OperacionInvalidaException("No tienes permiso para responder esta pregunta");
        }
        
        // Validar que la prueba no esté completada
        if (prueba.getCompletada()) {
            throw new OperacionInvalidaException("No se pueden agregar respuestas a una prueba técnica completada");
        }
        
        // Crear la respuesta
        Respuesta respuesta = new Respuesta();
        respuesta.setPregunta(pregunta);
        respuesta.setCandidato(candidato);
        respuesta.setContenido(request.getContenido());
        respuesta.setTexto(request.getTexto());
        respuesta.setOpcionSeleccionada(request.getOpcionSeleccionada());
        respuesta.setTiempoRespuestaSegundos(request.getTiempoRespuestaSegundos());
        respuesta.setFechaRespuesta(LocalDateTime.now());
        
        // Guardar la respuesta
        respuesta = respuestaRepository.save(respuesta);
        
        log.info("Respuesta ID: {} agregada a pregunta ID: {}", respuesta.getId(), preguntaId);
        
        // Verificar si todas las preguntas de la prueba tienen respuesta
        boolean todasConRespuesta = true;
        for (Pregunta p : prueba.getPreguntas()) {
            if (respuestaRepository.findByPreguntaId(p.getId()).isEmpty()) {
                todasConRespuesta = false;
                break;
            }
        }
        
        // Si todas las preguntas tienen respuesta, actualizar la prueba y la postulación
        if (todasConRespuesta) {
            prueba.finalizar();
            prueba.getPostulacion().setEstado(EstadoPostulacion.PRUEBA_COMPLETADA);
            prueba.getPostulacion().setFechaActualizacion(LocalDateTime.now());
            pruebaTecnicaRepository.save(prueba);
            
            log.info("Prueba técnica ID: {} completada", prueba.getId());
        }
        
        return respuestaMapper.toRespuestaResponse(respuesta);
    }

    @Override
    @Transactional
    public EvaluacionResponse evaluarPrueba(Long pruebaTecnicaId, Long reclutadorId, CreacionEvaluacionRequest request) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Validar que la prueba pertenece al reclutador
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para evaluar esta prueba técnica");
        }
        
        // Validar que la prueba está completada
        if (!prueba.getCompletada()) {
            throw new OperacionInvalidaException("No se puede evaluar una prueba técnica que no está completada");
        }
        
        // Solicitar evaluación de IA si se especifica
        if (request.isEvaluarConIA()) {
            try {
                Map<String, Object> evaluacionIA = integracionIAService.evaluarRespuestasPruebaTecnica(pruebaTecnicaId);
                if (evaluacionIA.containsKey("puntuacionTotal")) {
                    prueba.setPuntuacionTotal((Integer) evaluacionIA.get("puntuacionTotal"));
                }
                
                // Procesar evaluaciones individuales de preguntas
                if (evaluacionIA.containsKey("evaluacionesPreguntas")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> evaluacionesPreguntas = (List<Map<String, Object>>) evaluacionIA.get("evaluacionesPreguntas");
                    
                    for (Map<String, Object> evaluacionPregunta : evaluacionesPreguntas) {
                        Long preguntaId = Long.valueOf(evaluacionPregunta.get("preguntaId").toString());
                        Pregunta pregunta = preguntaRepository.findById(preguntaId)
                                .orElseThrow(() -> new RecursoNoEncontradoException("Pregunta no encontrada con ID: " + preguntaId));
                        
                        Integer puntuacion = (Integer) evaluacionPregunta.get("puntuacion");
                        pregunta.setPuntuacion(puntuacion);
                        
                        preguntaRepository.save(pregunta);
                    }
                }
            } catch (Exception e) {
                log.error("Error al solicitar evaluación de IA: {}", e.getMessage());
                // Continuar con la evaluación manual
            }
        }
        
        // Crear la evaluación general
        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setPruebaTecnica(prueba);
        evaluacion.setComentarios(request.getComentarios());
        evaluacion.setPuntuacion(request.getPuntuacion());
        evaluacion.setFechaEvaluacion(LocalDateTime.now());
        
        evaluacion = evaluacionRepository.save(evaluacion);
        
        // Actualizar la puntuación total de la prueba
        prueba.setPuntuacionTotal(request.getPuntuacion());
        pruebaTecnicaRepository.save(prueba);
        
        // Actualizar el estado de la postulación
        Postulacion postulacion = prueba.getPostulacion();
        postulacion.setEstado(request.getPuntuacion() >= 70 ? 
                EstadoPostulacion.SELECCIONADO : EstadoPostulacion.RECHAZADO);
        postulacion.setFechaActualizacion(LocalDateTime.now());
        postulacionRepository.save(postulacion);
        
        log.info("Prueba técnica ID: {} evaluada con puntuación: {}", pruebaTecnicaId, request.getPuntuacion());
        
        return pruebaTecnicaMapper.toEvaluacionResponse(evaluacion);
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse generarPruebaConIA(Long vacanteId, Long reclutadorId, String titulo, String descripcion, int numPreguntas) {
        // Obtener la vacante
        Vacante vacante = vacanteService.buscarVacantePorId(vacanteId);
        
        // Obtener el reclutador
        Reclutador reclutador = reclutadorService.buscarReclutadorPorId(reclutadorId);
        
        // Validar que la vacante pertenece al reclutador
        if (!vacante.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para crear pruebas técnicas para esta vacante");
        }
        
        // Crear la prueba técnica base
        PruebaTecnica prueba = new PruebaTecnica();
        prueba.setReclutador(reclutador);
        prueba.setVacante(vacante);
        prueba.setTitulo(titulo);
        prueba.setDescripcion(descripcion);
        prueba.setInstrucciones("Responda las siguientes preguntas técnicas relacionadas con la vacante.");
        prueba.setTiempoLimiteMinutos(60); // Por defecto, 1 hora
        prueba.setNivelDificultad("INTERMEDIO"); // Por defecto, nivel intermedio
        prueba.setTecnologias(vacante.getHabilidadesRequeridas());
        prueba.setFechaCreacion(LocalDateTime.now());
        prueba.setCompletada(false);
        
        // Guardar la prueba técnica
        prueba = pruebaTecnicaRepository.save(prueba);
        
        // Generar preguntas con IA
        try {
            List<String> preguntasGeneradas = integracionIAService.generarPreguntasPruebaTecnica(
                    vacante.getTitulo(),
                    vacante.getDescripcion(),
                    vacante.getHabilidadesRequeridas(),
                    numPreguntas);
            
            int orden = 1;
            for (String preguntaTexto : preguntasGeneradas) {
                Pregunta pregunta = new Pregunta();
                pregunta.setPruebaTecnica(prueba);
                pregunta.setEnunciado(preguntaTexto);
                pregunta.setTipoPregunta("DESARROLLO"); // Por defecto, pregunta de desarrollo
                pregunta.setPuntuacion(100 / numPreguntas); // Distribuir puntuación uniformemente
                pregunta.setOrden(orden++);
                
                preguntaRepository.save(pregunta);
            }
            
            log.info("Prueba técnica generada con IA con ID: {} para vacante ID: {}", prueba.getId(), vacanteId);
        } catch (Exception e) {
            log.error("Error al generar preguntas con IA: {}", e.getMessage());
            // Agregar unas preguntas genéricas en caso de error
            List<String> preguntasGenericas = new ArrayList<>();
            preguntasGenericas.add("Describe tu experiencia con las tecnologías mencionadas en la vacante.");
            preguntasGenericas.add("¿Cómo resolverías un problema de [tecnología principal] en un entorno de producción?");
            preguntasGenericas.add("Explica un proyecto desafiante en el que hayas trabajado y cómo lo abordaste.");
            
            int orden = 1;
            for (String preguntaTexto : preguntasGenericas) {
                Pregunta pregunta = new Pregunta();
                pregunta.setPruebaTecnica(prueba);
                pregunta.setEnunciado(preguntaTexto);
                pregunta.setTipoPregunta("DESARROLLO");
                pregunta.setPuntuacion(100 / preguntasGenericas.size());
                pregunta.setOrden(orden++);
                
                preguntaRepository.save(pregunta);
            }
        }
        
        // Recargar la prueba desde la base de datos para incluir las preguntas
        prueba = pruebaTecnicaRepository.findById(prueba.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la prueba técnica recién creada"));
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    public List<PruebaTecnicaResumenResponse> buscarPorReclutador(Long reclutadorId) {
        List<PruebaTecnica> pruebas = pruebaTecnicaRepository.findByReclutadorId(reclutadorId);
        return pruebas.stream()
                .map(pruebaTecnicaMapper::toPruebaTecnicaResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PruebaTecnicaResumenResponse> buscarPorCandidato(Long candidatoId) {
        List<PruebaTecnica> pruebas = pruebaTecnicaRepository.findByPostulacionCandidatoId(candidatoId);
        return pruebas.stream()
                .map(pruebaTecnicaMapper::toPruebaTecnicaResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PruebaTecnicaResumenResponse> buscarPorVacante(Long vacanteId) {
        List<PruebaTecnica> pruebas = pruebaTecnicaRepository.findByVacanteId(vacanteId);
        return pruebas.stream()
                .map(pruebaTecnicaMapper::toPruebaTecnicaResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PruebaTecnicaResumenResponse> buscarPendientesPorCandidato(Long candidatoId) {
        List<PruebaTecnica> pruebas = pruebaTecnicaRepository.findByPostulacionCandidatoIdAndCompletada(candidatoId, false);
        return pruebas.stream()
                .map(pruebaTecnicaMapper::toPruebaTecnicaResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PruebaTecnicaResumenResponse> buscarCompletadasPorCandidato(Long candidatoId) {
        List<PruebaTecnica> pruebas = pruebaTecnicaRepository.findByPostulacionCandidatoIdAndCompletada(candidatoId, true);
        return pruebas.stream()
                .map(pruebaTecnicaMapper::toPruebaTecnicaResumenResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PruebaTecnica buscarPruebaTecnicaPorId(Long id) {
        return pruebaTecnicaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró prueba técnica con ID: " + id));
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse marcarComoCompletada(Long pruebaTecnicaId, Long candidatoId) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Validar que la prueba pertenece a una postulación del candidato
        if (prueba.getPostulacion() == null || !prueba.getPostulacion().getCandidato().getId().equals(candidatoId)) {
            throw new OperacionInvalidaException("No tienes permiso para marcar esta prueba como completada");
        }
        
        // Validar que todas las preguntas tienen respuesta
        List<Pregunta> preguntasSinRespuesta = new ArrayList<>();
        for (Pregunta pregunta : prueba.getPreguntas()) {
            Optional<Respuesta> respuesta = respuestaRepository.findByPreguntaId(pregunta.getId());
            if (respuesta.isEmpty()) {
                preguntasSinRespuesta.add(pregunta);
            }
        }
        
        if (!preguntasSinRespuesta.isEmpty()) {
            String mensajeError = "No se puede completar la prueba técnica. Faltan responder " + preguntasSinRespuesta.size() + " preguntas.";
            throw new OperacionInvalidaException(mensajeError);
        }
        
        // Marcar la prueba como completada
        prueba.finalizar();
        prueba = pruebaTecnicaRepository.save(prueba);
        
        // Actualizar el estado de la postulación
        Postulacion postulacion = prueba.getPostulacion();
        postulacion.setEstado(EstadoPostulacion.PRUEBA_COMPLETADA);
        postulacion.setFechaActualizacion(LocalDateTime.now());
        postulacionRepository.save(postulacion);
        
        log.info("Prueba técnica ID: {} marcada como completada por candidato ID: {}", pruebaTecnicaId, candidatoId);
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    public List<String> generarPreguntasConIA(Long vacanteId, int numPreguntas) {
        try {
            // Obtener vacante para extraer los datos necesarios
            Vacante vacante = vacanteService.buscarVacantePorId(vacanteId);
            return integracionIAService.generarPreguntasPruebaTecnica(
                    vacante.getTitulo(),
                    vacante.getDescripcion(),
                    vacante.getHabilidadesRequeridas(),
                    numPreguntas);
        } catch (Exception e) {
            log.error("Error al generar preguntas con IA: {}", e.getMessage());
            List<String> preguntasGenericas = new ArrayList<>();
            preguntasGenericas.add("Describe tu experiencia con las tecnologías mencionadas en la vacante.");
            preguntasGenericas.add("¿Cómo resolverías un problema técnico en un entorno de producción?");
            preguntasGenericas.add("Explica un proyecto desafiante en el que hayas trabajado y cómo lo abordaste.");
            return preguntasGenericas.subList(0, Math.min(numPreguntas, preguntasGenericas.size()));
        }
    }
}