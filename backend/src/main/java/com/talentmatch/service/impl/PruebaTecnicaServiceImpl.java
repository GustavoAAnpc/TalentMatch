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
import com.talentmatch.service.PruebaTecnicaService;
import com.talentmatch.service.ReclutadorService;
import com.talentmatch.service.VacanteService;
import com.talentmatch.repository.CandidatoRepository;

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
    private final IntegracionIAService integracionIAService;
    private final CandidatoRepository candidatoRepository;

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
        Postulacion postulacion = postulacionRepository.findById(postulacionId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró postulación con ID: " + postulacionId));
        
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
            
            log.info("Prueba técnica ID: {} completada");
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
                pregunta.setTipoPregunta("ABIERTA");
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
                pregunta.setTipoPregunta("ABIERTA");
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

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse regenerarPreguntasParaPrueba(Long pruebaTecnicaId, Long reclutadorId, int numPreguntas) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Verificar que el reclutador es el propietario de la prueba
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta prueba técnica");
        }
        
        // Eliminar preguntas existentes si las hay
        if (prueba.getPreguntas() != null && !prueba.getPreguntas().isEmpty()) {
            prueba.getPreguntas().forEach(pregunta -> preguntaRepository.delete(pregunta));
            prueba.getPreguntas().clear();
        }
        
        // Limpiar preguntasTexto si existe
        prueba.setPreguntasTexto(null);
        
        // Generar nuevas preguntas con IA
        try {
            List<String> preguntasGeneradas;
            
            // Comprobar si hay una vacante asociada para usar su información
            if (prueba.getVacante() != null) {
                // Obtener información relevante de la vacante para la generación
                Vacante vacante = prueba.getVacante();
                
                // Generar preguntas con IA usando información de la vacante
                preguntasGeneradas = integracionIAService.generarPreguntasPruebaTecnica(
                        vacante.getTitulo(),
                        vacante.getDescripcion(),
                        vacante.getHabilidadesRequeridas(),
                        numPreguntas);
            } else {
                // Si no hay vacante, usar la información de la prueba técnica directamente
                preguntasGeneradas = integracionIAService.generarPreguntasPruebaTecnica(
                        prueba.getTitulo(),
                        prueba.getDescripcion(),
                        prueba.getTecnologias(),
                        numPreguntas);
            }
            
            // Si estamos usando preguntas estructuradas
            if (preguntasGeneradas != null && !preguntasGeneradas.isEmpty()) {
                int index = 1;
                for (String preguntaTexto : preguntasGeneradas) {
                    // Crear pregunta
                    Pregunta pregunta = new Pregunta();
                    pregunta.setPruebaTecnica(prueba);
                    pregunta.setEnunciado(preguntaTexto);
                    pregunta.setTipoPregunta("ABIERTA");
                    pregunta.setOrden(index++);
                    pregunta.setPuntuacion(100 / preguntasGeneradas.size()); // Distribuir puntos equitativamente
                    
                    // Guardar pregunta
                    preguntaRepository.save(pregunta);
                }
            } else {
                // Si no se pudieron generar preguntas estructuradas, guardar como texto
                prueba.setPreguntasTexto(String.join("|||", preguntasGeneradas));
            }
            
            // Guardar la prueba actualizada
            prueba = pruebaTecnicaRepository.save(prueba);
            
            log.info("Preguntas regeneradas para prueba técnica ID: {} por reclutador ID: {}", pruebaTecnicaId, reclutadorId);
            
            return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
            
        } catch (Exception e) {
            log.error("Error al regenerar preguntas para prueba técnica ID: {}", pruebaTecnicaId, e);
            throw new OperacionInvalidaException("Error al regenerar preguntas: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PreguntaResponse actualizarPregunta(Long preguntaId, Long reclutadorId, CreacionPreguntaRequest request) {
        // Obtener la pregunta
        Pregunta pregunta = preguntaRepository.findById(preguntaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la pregunta con ID: " + preguntaId));
        
        // Verificar que la pregunta pertenece a una prueba
        PruebaTecnica prueba = pregunta.getPruebaTecnica();
        if (prueba == null) {
            throw new OperacionInvalidaException("La pregunta no está asociada a ninguna prueba técnica");
        }
        
        // Verificar que el reclutador es el propietario de la prueba
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta pregunta");
        }
        
        // Actualizar los campos de la pregunta
        pregunta.setEnunciado(request.getEnunciado());
        pregunta.setTipoPregunta(request.getTipoPregunta());
        pregunta.setOpciones(request.getOpciones());
        pregunta.setRespuestaCorrecta(request.getRespuestaCorrecta());
        pregunta.setPuntuacion(request.getPuntuacion());
        
        // Guardar los cambios
        pregunta = preguntaRepository.save(pregunta);
        
        log.info("Pregunta ID: {} actualizada por reclutador ID: {}", preguntaId, reclutadorId);
        
        return preguntaMapper.toPreguntaResponse(pregunta);
    }

    @Override
    public PreguntaResponse buscarPreguntaPorId(Long preguntaId) {
        Pregunta pregunta = preguntaRepository.findById(preguntaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la pregunta con ID: " + preguntaId));
        
        return preguntaMapper.toPreguntaResponse(pregunta);
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse actualizarPruebaTecnica(Long pruebaTecnicaId, Long reclutadorId, CreacionPruebaTecnicaRequest request) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Verificar que el reclutador es el propietario de la prueba
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar esta prueba técnica");
        }
        
        // Obtener la vacante si se proporciona
        Vacante vacante = null;
        if (request.getVacanteId() != null) {
            vacante = vacanteService.buscarVacantePorId(request.getVacanteId());
            
            // Validar que la vacante pertenece al reclutador
            if (!vacante.getReclutador().getId().equals(reclutadorId)) {
                throw new OperacionInvalidaException("No tienes permiso para asociar esta prueba técnica a esta vacante");
            }
        }
        
        // Actualizar los campos de la prueba
        prueba.setVacante(vacante);
        prueba.setTitulo(request.getTitulo());
        prueba.setDescripcion(request.getDescripcion());
        prueba.setInstrucciones(request.getInstrucciones());
        prueba.setTiempoLimiteMinutos(request.getTiempoLimiteMinutos());
        prueba.setNivelDificultad(request.getNivelDificultad());
        prueba.setTecnologias(request.getTecnologias());
        
        // Guardar los cambios
        prueba = pruebaTecnicaRepository.save(prueba);
        
        log.info("Prueba técnica ID: {} actualizada por reclutador ID: {}", pruebaTecnicaId, reclutadorId);
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse generarPruebaConIAPorTitulo(Long reclutadorId, String titulo, String descripcion, String tecnologias, int numPreguntas) {
        log.info("Generando prueba técnica con IA por título: {}, reclutador ID: {}", titulo, reclutadorId);
        
        // Validar datos
        if (titulo == null || titulo.trim().isEmpty()) {
            throw new OperacionInvalidaException("El título de la prueba técnica no puede estar vacío");
        }
        
        if (descripcion == null || descripcion.trim().isEmpty()) {
            throw new OperacionInvalidaException("La descripción de la prueba técnica no puede estar vacía");
        }
        
        if (tecnologias == null || tecnologias.trim().isEmpty()) {
            throw new OperacionInvalidaException("Las tecnologías de la prueba técnica no pueden estar vacías");
        }
        
        // Obtener el reclutador
        Reclutador reclutador = reclutadorService.buscarReclutadorPorId(reclutadorId);
        
        // Crear la prueba técnica
        PruebaTecnica prueba = new PruebaTecnica();
        prueba.setTitulo(titulo);
        prueba.setDescripcion(descripcion);
        prueba.setInstrucciones("Por favor, lee atentamente cada pregunta y proporciona respuestas claras y concisas. Asegúrate de explicar tu razonamiento cuando sea necesario.");
        prueba.setTiempoLimiteMinutos(60); // Valor predeterminado
        prueba.setNivelDificultad("INTERMEDIO"); // Valor predeterminado
        prueba.setTecnologias(tecnologias);
        prueba.setReclutador(reclutador);
        prueba.setFechaCreacion(LocalDateTime.now());
        prueba.setCompletada(false);
        
        // Guardar la prueba técnica
        prueba = pruebaTecnicaRepository.save(prueba);
        
        // Generar preguntas con IA
        try {
            // Generar preguntas basadas en el título, descripción y tecnologías
            List<String> preguntasGeneradas = integracionIAService.generarPreguntasPruebaTecnica(
                    titulo,
                    descripcion,
                    tecnologias,
                    numPreguntas);
            
            int orden = 1;
            for (String preguntaTexto : preguntasGeneradas) {
                Pregunta pregunta = new Pregunta();
                pregunta.setPruebaTecnica(prueba);
                pregunta.setEnunciado(preguntaTexto);
                pregunta.setTipoPregunta("ABIERTA");
                pregunta.setPuntuacion(100 / numPreguntas); // Distribuir puntuación uniformemente
                pregunta.setOrden(orden++);
                
                preguntaRepository.save(pregunta);
            }
            
            log.info("Prueba técnica generada con IA con ID: {} basada en título y descripción", prueba.getId());
        } catch (Exception e) {
            log.error("Error al generar preguntas con IA: {}", e.getMessage());
            // Agregar unas preguntas genéricas en caso de error
            List<String> preguntasGenericas = new ArrayList<>();
            preguntasGenericas.add("Describe tu experiencia con las tecnologías mencionadas en la descripción.");
            preguntasGenericas.add("¿Cómo resolverías un problema técnico relacionado con " + titulo + "?");
            preguntasGenericas.add("Explica un proyecto desafiante en el que hayas trabajado con estas tecnologías y cómo lo abordaste.");
            
            int orden = 1;
            for (String preguntaTexto : preguntasGenericas) {
                Pregunta pregunta = new Pregunta();
                pregunta.setPruebaTecnica(prueba);
                pregunta.setEnunciado(preguntaTexto);
                pregunta.setTipoPregunta("ABIERTA");
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
    @Transactional
    public void eliminarPruebaTecnica(Long pruebaTecnicaId, Long reclutadorId) {
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Validar que la prueba pertenece al reclutador
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para eliminar esta prueba técnica");
        }
        
        // Verificar si la prueba está asignada a una postulación y está completada o evaluada
        if (prueba.getPostulacion() != null && 
            (Boolean.TRUE.equals(prueba.getCompletada()) || 
             (prueba.getPostulacion().getEstado() == EstadoPostulacion.PRUEBA_COMPLETADA))) {
            throw new OperacionInvalidaException("No se puede eliminar una prueba técnica que ya ha sido completada o evaluada");
        }
        
        // Eliminar la prueba técnica
        pruebaTecnicaRepository.delete(prueba);
        
        log.info("Prueba técnica ID: {} eliminada por reclutador ID: {}", pruebaTecnicaId, reclutadorId);
    }
    
    @Override
    @Transactional
    public void eliminarPregunta(Long preguntaId, Long reclutadorId) {
        // Obtener la pregunta
        Pregunta pregunta = preguntaRepository.findById(preguntaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró pregunta con ID: " + preguntaId));
        
        // Obtener la prueba técnica asociada
        PruebaTecnica prueba = pregunta.getPruebaTecnica();
        
        // Validar que la prueba pertenece al reclutador
        if (!prueba.getReclutador().getId().equals(reclutadorId)) {
            throw new OperacionInvalidaException("No tienes permiso para eliminar esta pregunta");
        }
        
        // Verificar si la prueba está asignada a una postulación y está completada o evaluada
        if (prueba.getPostulacion() != null && 
            (Boolean.TRUE.equals(prueba.getCompletada()) || 
             (prueba.getPostulacion().getEstado() == EstadoPostulacion.PRUEBA_COMPLETADA))) {
            throw new OperacionInvalidaException("No se puede eliminar una pregunta de una prueba técnica que ya ha sido completada o evaluada");
        }
        
        // Verificar si la pregunta tiene respuestas asociadas
        Optional<Respuesta> respuesta = respuestaRepository.findByPreguntaId(preguntaId);
        if (respuesta.isPresent()) {
            throw new OperacionInvalidaException("No se puede eliminar una pregunta que ya tiene respuestas asociadas");
        }
        
        // Eliminar la pregunta
        preguntaRepository.delete(pregunta);
        
        log.info("Pregunta ID: {} eliminada por reclutador ID: {}", preguntaId, reclutadorId);
    }

    @Override
    public PruebaTecnica buscarPruebaTecnicaPorPostulacion(Long postulacionId) {
        return pruebaTecnicaRepository.findByPostulacionId(postulacionId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró prueba técnica asociada a la postulación con ID: " + postulacionId));
    }

    @Override
    public PruebaTecnicaDetalleResponse buscarPorPostulacion(Long postulacionId) {
        PruebaTecnica prueba = buscarPruebaTecnicaPorPostulacion(postulacionId);
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }

    @Override
    @Transactional
    public PruebaTecnicaDetalleResponse asignarACandidato(Long pruebaTecnicaId, Long candidatoId, Long reclutadorId) {
        log.info("Asignando prueba técnica ID: {} a candidato ID: {} por reclutador ID: {}", pruebaTecnicaId, candidatoId, reclutadorId);
        
        // Obtener la prueba técnica
        PruebaTecnica prueba = buscarPruebaTecnicaPorId(pruebaTecnicaId);
        
        // Verificar permisos - permitir auto-asignación por candidatos
        boolean esAutoAsignacion = candidatoId != null && candidatoId.equals(reclutadorId);
        boolean esReclutadorValido = reclutadorId != null && prueba.getReclutador() != null && 
                                    prueba.getReclutador().getId().equals(reclutadorId);
        
        if (!esAutoAsignacion && !esReclutadorValido) {
            log.warn("Intento de asignación no autorizado: candidatoId={}, reclutadorId={}, pruebaTecnicaId={}", 
                    candidatoId, reclutadorId, pruebaTecnicaId);
            
            // Si es un candidato intentando auto-asignarse, permitirlo
            if (esAutoAsignacion) {
                log.info("Candidato ID: {} se está auto-asignando la prueba ID: {}", candidatoId, pruebaTecnicaId);
            } else {
                throw new OperacionInvalidaException("No tienes permiso para asignar esta prueba técnica");
            }
        }
        
        // Obtener el candidato
        Candidato candidato = candidatoRepository.findById(candidatoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el candidato con ID: " + candidatoId));
        
        // Buscar una postulación activa del candidato para la vacante de la prueba
        Postulacion postulacion = null;
        if (prueba.getVacante() != null) {
            postulacion = postulacionRepository.findByVacanteIdAndCandidatoId(prueba.getVacante().getId(), candidatoId)
                    .orElse(null);
            
            log.info("Postulación existente encontrada: {}", postulacion != null ? postulacion.getId() : "ninguna");
        }
        
        // Si no hay postulación y la prueba tiene vacante, crear una nueva postulación
        if (postulacion == null && prueba.getVacante() != null) {
            log.info("No se encontró postulación para la vacante ID: {} y candidato ID: {}, creando nueva postulación",
                    prueba.getVacante().getId(), candidatoId);
            
            postulacion = new Postulacion();
            postulacion.setCandidato(candidato);
            postulacion.setVacante(prueba.getVacante());
            postulacion.setEstado(EstadoPostulacion.PRUEBA_PENDIENTE);
            postulacion.setFechaCreacion(LocalDateTime.now());
            
            postulacion = postulacionRepository.save(postulacion);
            log.info("Nueva postulación creada con ID: {}", postulacion.getId());
        }
        
        // Asignar la prueba al candidato
        if (postulacion != null) {
            prueba.setPostulacion(postulacion);
            
            // Actualizar el estado de la postulación si es necesario
            if (postulacion.getEstado() == EstadoPostulacion.APLICADA) {
                postulacion.setEstado(EstadoPostulacion.PRUEBA_PENDIENTE);
                postulacionRepository.save(postulacion);
                log.info("Estado de la postulación ID: {} actualizado a PRUEBA_PENDIENTE", postulacion.getId());
            }
        } else {
            log.warn("No se pudo crear o encontrar una postulación para asignar la prueba");
        }
        
        // Guardar los cambios
        prueba = pruebaTecnicaRepository.save(prueba);
        
        log.info("Prueba técnica ID: {} asignada a candidato ID: {}", pruebaTecnicaId, candidatoId);
        
        return pruebaTecnicaMapper.toPruebaTecnicaDetalleResponse(prueba);
    }
}