package com.talentmatch.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import com.talentmatch.model.entity.Usuario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.ActualizacionCandidatoRequest;
import com.talentmatch.dto.request.RegistroCandidatoRequest;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.exception.EntidadDuplicadaException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.mapper.CandidatoMapper;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.UsuarioRepository;
import com.talentmatch.repository.VacanteRepository;
import com.talentmatch.service.CandidatoService;
import com.talentmatch.service.StorageService;
import com.talentmatch.service.IntegracionIAService;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de candidatos.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CandidatoServiceImpl implements CandidatoService {

    private final CandidatoRepository candidatoRepository;
    private final VacanteRepository vacanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final CandidatoMapper candidatoMapper;
    private final StorageService storageService;
    private final IntegracionIAService integracionIAService;

    @Override
    @Transactional
    public CandidatoResponse registrar(RegistroCandidatoRequest request) {
        // Validación de email único
        if (candidatoRepository.existsByEmail(request.getEmail())) {
            throw new EntidadDuplicadaException("Ya existe un candidato con el email: " + request.getEmail());
        }
        
        // Convertir DTO a entidad y persistir
        Candidato candidato = candidatoMapper.toCandidato(request);
        candidato = candidatoRepository.save(candidato);
        
        log.info("Candidato registrado con ID: {}", candidato.getId());
        
        return candidatoMapper.toCandidatoResponse(candidato);
    }

    @Override
    public CandidatoResponse buscarPorId(Long id) {
        Candidato candidato = buscarCandidatoPorId(id);
        return candidatoMapper.toCandidatoResponse(candidato);
    }

    @Override
    public CandidatoResponse buscarPorEmail(String email) {
        return candidatoRepository.findByEmail(email)
                .map(candidatoMapper::toCandidatoResponse)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró candidato con email: " + email));
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public CandidatoResponse actualizar(Long id, ActualizacionCandidatoRequest request) {
        try {
            log.info("Iniciando actualización del candidato con ID: {}", id);
            log.debug("Datos recibidos para actualización: {}", request);
            
            Candidato candidato = buscarCandidatoPorId(id);
            
            // Actualización manual de campos para evitar problemas con campos nulos
            if (request.getNombre() != null) {
                candidato.setNombre(request.getNombre());
            }
            if (request.getApellido() != null) {
                candidato.setApellido(request.getApellido());
            }
            if (request.getTelefono() != null) {
                candidato.setTelefono(request.getTelefono());
            }
            if (request.getFechaNacimiento() != null) {
                candidato.setFechaNacimiento(request.getFechaNacimiento());
            }
            if (request.getTituloProfesional() != null) {
                candidato.setTituloProfesional(request.getTituloProfesional());
            }
            if (request.getResumenPerfil() != null) {
                candidato.setResumenPerfil(request.getResumenPerfil());
            }
            if (request.getUbicacion() != null) {
                candidato.setUbicacion(request.getUbicacion());
            }
            if (request.getLinkedinUrl() != null) {
                candidato.setLinkedinUrl(request.getLinkedinUrl());
            }
            if (request.getGithubUrl() != null) {
                candidato.setGithubUrl(request.getGithubUrl());
            }
            if (request.getPortfolioUrl() != null) {
                candidato.setPortfolioUrl(request.getPortfolioUrl());
            }
            if (request.getHabilidadesPrincipales() != null) {
                candidato.setHabilidadesPrincipales(request.getHabilidadesPrincipales());
            }
            if (request.getExperienciaAnios() != null) {
                candidato.setExperienciaAnios(request.getExperienciaAnios());
            }
            if (request.getDisponibilidadInmediata() != null) {
                candidato.setDisponibilidadInmediata(request.getDisponibilidadInmediata());
            }
            
            // Actualizar fecha de modificación
            candidato.setFechaActualizacion(LocalDateTime.now());
            
            // Guardar el candidato actualizado
            candidato = candidatoRepository.save(candidato);
            
            log.info("Candidato actualizado con éxito, ID: {}", candidato.getId());
            
            return candidatoMapper.toCandidatoResponse(candidato);
        } catch (Exception e) {
            log.error("Error al actualizar el candidato ID: {}, Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Ha ocurrido un error al actualizar el candidato: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public String actualizarCurriculum(Long id, MultipartFile curriculum) {
        try {
            log.info("Actualizando curriculum para candidato ID: {}", id);
            
            // Validar formato y tamaño del archivo
            validarArchivoCV(curriculum);
            
            Candidato candidato = buscarCandidatoPorId(id);
            
            // Eliminar curriculum anterior si existe
            if (candidato.getUrlCurriculum() != null) {
                storageService.eliminarArchivo(candidato.getUrlCurriculum());
            }
            
            // Guardar nuevo curriculum
            String ruta = "candidatos/" + id + "/cv";
            String nombreArchivo = "curriculum_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
                    "_" + curriculum.getOriginalFilename().replace(" ", "_");
            
            String url = storageService.guardarArchivo(curriculum, ruta, nombreArchivo);
            
            candidato.setUrlCurriculum(url);
            candidatoRepository.save(candidato);
            
            log.info("Currículum actualizado para el candidato ID: {}", id);
            
            // Analizar el curriculum y actualizar el perfil
            actualizarPerfilConAnalisisCV(candidato, curriculum);
            
            return url;
        } catch (Exception e) {
            log.error("Error al actualizar currículum: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar currículum: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public String subirCurriculum(Long candidatoId, MultipartFile curriculum) {
        try {
            log.info("Iniciando proceso de subida de CV para candidato ID: {}", candidatoId);
            
            // Validar formato y tamaño del archivo
            validarArchivoCV(curriculum);
            
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Candidato no encontrado con ID: " + candidatoId));
            
            // Guardar el archivo usando el servicio de almacenamiento
            String ruta = "candidatos/" + candidatoId + "/cv";
            String nombreArchivo = "curriculum_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
                    "_" + curriculum.getOriginalFilename().replace(" ", "_");
            
            String url = storageService.guardarArchivo(curriculum, ruta, nombreArchivo);
            
            // Actualizar la URL del currículum en el candidato
            candidato.setUrlCurriculum(url);
            candidatoRepository.save(candidato);
            
            // Analizar el CV y actualizar el perfil
            actualizarPerfilConAnalisisCV(candidato, curriculum);
            
            log.info("CV subido exitosamente para candidato ID: {}", candidatoId);
            return url;
        } catch (Exception e) {
            log.error("Error al subir currículum: {}", e.getMessage(), e);
            throw new RuntimeException("Error al subir currículum: " + e.getMessage());
        }
    }

    /**
     * Valida el formato y tamaño del archivo de currículum.
     * 
     * @param curriculum Archivo a validar
     * @throws IllegalArgumentException Si el archivo no cumple con los requisitos
     */
    private void validarArchivoCV(MultipartFile curriculum) {
        if (curriculum.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        
        // Verificar tamaño máximo (5MB)
        long maxSize = 5 * 1024 * 1024; // 5MB en bytes
        if (curriculum.getSize() > maxSize) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de 5MB");
        }
        
        // Verificar tipo de archivo permitido
        String contentType = curriculum.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") && 
                !contentType.equals("application/msword") && 
                !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
                !contentType.equals("text/plain"))) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX y TXT");
        }
    }

    /**
     * Analiza el currículum con IA y actualiza el perfil del candidato.
     * 
     * @param candidato Candidato a actualizar
     * @param curriculum Archivo de currículum
     */
    private void actualizarPerfilConAnalisisCV(Candidato candidato, MultipartFile curriculum) {
        try {
            log.info("Analizando CV con IA para candidato ID: {}", candidato.getId());
            
            // Almacenar el tamaño y tipo de archivo para diagnóstico
            log.debug("CV a analizar - Tipo: {}, Tamaño: {} bytes", 
                    curriculum.getContentType(), curriculum.getSize());
            
            // Analizar el curriculum con el servicio de IA
            Map<String, Object> analisisCurriculum = integracionIAService.analizarCurriculum(curriculum);
            
            // Verificar si hay errores en el análisis
            if (analisisCurriculum.containsKey("error")) {
                log.warn("Error en el análisis de CV: {}", analisisCurriculum.get("error"));
                return;
            }
            
            if (analisisCurriculum.containsKey("advertencia")) {
                log.warn("Advertencia en el análisis de CV: {}", analisisCurriculum.get("advertencia"));
            }
            
            boolean perfilActualizado = false;
            
            // Procesar datos personales si están disponibles
            if (analisisCurriculum.containsKey("datosPersonales") && 
                analisisCurriculum.get("datosPersonales") instanceof Map) {
                
                @SuppressWarnings("unchecked")
                Map<String, Object> datosPersonales = (Map<String, Object>) analisisCurriculum.get("datosPersonales");
                log.debug("Datos personales extraídos del CV: {}", datosPersonales);
                
                // Extraer nombre si el campo está vacío
                if ((candidato.getNombre() == null || candidato.getNombre().isEmpty()) && 
                        datosPersonales.containsKey("nombre") && datosPersonales.get("nombre") != null) {
                    String nombre = datosPersonales.get("nombre").toString().trim();
                    if (!nombre.isEmpty()) {
                        candidato.setNombre(nombre);
                        log.debug("Actualizado nombre: {}", nombre);
                        perfilActualizado = true;
                    }
                }
                
                // Extraer apellido si el campo está vacío
                if ((candidato.getApellido() == null || candidato.getApellido().isEmpty()) && 
                        datosPersonales.containsKey("apellido") && datosPersonales.get("apellido") != null) {
                    String apellido = datosPersonales.get("apellido").toString().trim();
                    if (!apellido.isEmpty()) {
                        candidato.setApellido(apellido);
                        log.debug("Actualizado apellido: {}", apellido);
                        perfilActualizado = true;
                    }
                }
                
                // Extraer teléfono si el campo está vacío
                if ((candidato.getTelefono() == null || candidato.getTelefono().isEmpty()) && 
                        datosPersonales.containsKey("telefono") && datosPersonales.get("telefono") != null) {
                    String telefono = datosPersonales.get("telefono").toString().trim();
                    if (!telefono.isEmpty()) {
                        candidato.setTelefono(telefono);
                        log.debug("Actualizado teléfono: {}", telefono);
                        perfilActualizado = true;
                    }
                }
                
                // Extraer ubicación si el campo está vacío
                if ((candidato.getUbicacion() == null || candidato.getUbicacion().isEmpty()) && 
                        datosPersonales.containsKey("ubicacion") && datosPersonales.get("ubicacion") != null) {
                    String ubicacion = datosPersonales.get("ubicacion").toString().trim();
                    if (!ubicacion.isEmpty()) {
                        candidato.setUbicacion(ubicacion);
                        log.debug("Actualizada ubicación: {}", ubicacion);
                        perfilActualizado = true;
                    }
                }
                
                // Extraer sitio web si el campo portfolioUrl está vacío
                if ((candidato.getPortfolioUrl() == null || candidato.getPortfolioUrl().isEmpty()) && 
                        datosPersonales.containsKey("sitioWeb") && datosPersonales.get("sitioWeb") != null) {
                    String sitioWeb = datosPersonales.get("sitioWeb").toString().trim();
                    if (!sitioWeb.isEmpty()) {
                        candidato.setPortfolioUrl(sitioWeb);
                        log.debug("Actualizado sitio web/portfolio: {}", sitioWeb);
                        perfilActualizado = true;
                    }
                }
            }
            
            // Extraer título profesional si el campo está vacío
            if ((candidato.getTituloProfesional() == null || candidato.getTituloProfesional().isEmpty()) && 
                    analisisCurriculum.containsKey("tituloProfesional") && 
                    analisisCurriculum.get("tituloProfesional") != null) {
                String tituloProfesional = analisisCurriculum.get("tituloProfesional").toString().trim();
                if (!tituloProfesional.isEmpty()) {
                    candidato.setTituloProfesional(tituloProfesional);
                    log.debug("Actualizado título profesional: {}", tituloProfesional);
                    perfilActualizado = true;
                }
            }
            
            // Extraer resumen del perfil si el campo está vacío
            if ((candidato.getResumenPerfil() == null || candidato.getResumenPerfil().isEmpty()) && 
                    analisisCurriculum.containsKey("resumenPerfil") && 
                    analisisCurriculum.get("resumenPerfil") != null) {
                String resumenPerfil = analisisCurriculum.get("resumenPerfil").toString().trim();
                if (!resumenPerfil.isEmpty()) {
                    candidato.setResumenPerfil(resumenPerfil);
                    log.debug("Actualizado resumen del perfil");
                    perfilActualizado = true;
                }
            }
            
            // Extraer años de experiencia si el campo está vacío
            if (candidato.getExperienciaAnios() == null && 
                    analisisCurriculum.containsKey("anosExperiencia") && 
                    analisisCurriculum.get("anosExperiencia") != null) {
                
                Object anosExp = analisisCurriculum.get("anosExperiencia");
                Integer experienciaAnios = null;
                
                try {
                    if (anosExp instanceof Integer) {
                        experienciaAnios = (Integer) anosExp;
                    } else if (anosExp instanceof Double) {
                        experienciaAnios = ((Double) anosExp).intValue();
                    } else if (anosExp instanceof String) {
                        experienciaAnios = Integer.parseInt(((String) anosExp).trim());
                    } else if (anosExp instanceof Number) {
                        experienciaAnios = ((Number) anosExp).intValue();
                    }
                    
                    if (experienciaAnios != null && experienciaAnios >= 0) {
                        candidato.setExperienciaAnios(experienciaAnios);
                        log.debug("Actualizado años de experiencia: {}", experienciaAnios);
                        perfilActualizado = true;
                    }
                } catch (NumberFormatException e) {
                    log.warn("No se pudo convertir años de experiencia '{}': {}", anosExp, e.getMessage());
                }
            }
            
            // Extraer habilidades si el campo está vacío
            if ((candidato.getHabilidadesPrincipales() == null || candidato.getHabilidadesPrincipales().isEmpty()) && 
                    analisisCurriculum.containsKey("habilidadesTecnicas")) {
                
                List<String> habilidades = new ArrayList<>();
                
                Object habilidadesObj = analisisCurriculum.get("habilidadesTecnicas");
                if (habilidadesObj instanceof List<?>) {
                    @SuppressWarnings("unchecked")
                    List<Object> listaHabilidades = (List<Object>) habilidadesObj;
                    
                    for (Object hab : listaHabilidades) {
                        if (hab != null) {
                            String habilidad = hab.toString().trim();
                            if (!habilidad.isEmpty()) {
                                habilidades.add(habilidad);
                            }
                        }
                    }
                } else if (habilidadesObj instanceof String) {
                    String habilidadesStr = ((String) habilidadesObj).trim();
                    if (!habilidadesStr.isEmpty()) {
                        // Dividir por comas si es una cadena
                        String[] habilidadesArray = habilidadesStr.split(",");
                        for (String hab : habilidadesArray) {
                            String habilidad = hab.trim();
                            if (!habilidad.isEmpty()) {
                                habilidades.add(habilidad);
                            }
                        }
                    }
                }
                
                if (!habilidades.isEmpty()) {
                    candidato.setHabilidadesPrincipales(String.join(", ", habilidades));
                    log.debug("Actualizadas habilidades principales: {}", String.join(", ", habilidades));
                    perfilActualizado = true;
                }
            }
            
            // Guardar candidato actualizado
            if (perfilActualizado) {
                candidato.setFechaActualizacion(LocalDateTime.now());
                candidatoRepository.save(candidato);
                log.info("Perfil del candidato ID: {} actualizado con información del CV", candidato.getId());
            } else {
                log.info("No se actualizó el perfil del candidato ID: {} (no se encontró información nueva)", candidato.getId());
            }
        } catch (Exception e) {
            // Solo loggear el error, no interrumpir el proceso
            log.error("Error al analizar CV con IA para candidato ID {}: {}", candidato.getId(), e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public boolean agregarVacanteFavorita(Long candidatoId, Long vacanteId) {
        Candidato candidato = buscarCandidatoPorId(candidatoId);
        Vacante vacante = vacanteRepository.findById(vacanteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró vacante con ID: " + vacanteId));
        
        boolean resultado = candidato.agregarVacanteFavorita(vacante);
        candidatoRepository.save(candidato);
        
        log.info("Vacante ID: {} {} a favoritos del candidato ID: {}", 
                vacanteId, resultado ? "agregada" : "ya existe en", candidatoId);
        
        return resultado;
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public boolean eliminarVacanteFavorita(Long candidatoId, Long vacanteId) {
        Candidato candidato = buscarCandidatoPorId(candidatoId);
        Vacante vacante = vacanteRepository.findById(vacanteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró vacante con ID: " + vacanteId));
        
        boolean resultado = candidato.eliminarVacanteFavorita(vacante);
        candidatoRepository.save(candidato);
        
        log.info("Vacante ID: {} {} de favoritos del candidato ID: {}", 
                vacanteId, resultado ? "eliminada" : "no existe en", candidatoId);
        
        return resultado;
    }

    @Override
    public boolean esVacanteFavorita(Long candidatoId, Long vacanteId) {
        Candidato candidato = buscarCandidatoPorId(candidatoId);
        return candidato.getVacantesFavoritas().stream()
                .anyMatch(vacante -> vacante.getId().equals(vacanteId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.talentmatch.dto.response.VacanteResumenResponse> obtenerVacantasFavoritas(Long candidatoId) {
        log.info("Obteniendo vacantes favoritas para candidato ID: {}", candidatoId);
        
        try {
            Candidato candidato = buscarCandidatoPorId(candidatoId);
            
            // Mapear las vacantes favoritas a DTOs
            return candidato.getVacantesFavoritas().stream()
                    .map(vacante -> {
                        com.talentmatch.dto.response.VacanteResumenResponse resumen = new com.talentmatch.dto.response.VacanteResumenResponse();
                        resumen.setId(vacante.getId());
                        resumen.setTitulo(vacante.getTitulo());
                        // Otros campos disponibles
                        resumen.setArea(vacante.getArea());
                        resumen.setUbicacion(vacante.getUbicacion());
                        // Convertir String a enum Modalidad si es necesario
                        if (vacante.getModalidad() != null) {
                            try {
                                resumen.setModalidad(com.talentmatch.model.enums.Modalidad.valueOf(vacante.getModalidad().toUpperCase()));
                            } catch (IllegalArgumentException e) {
                                log.warn("Modalidad no reconocida: {}", vacante.getModalidad());
                            }
                        }
                        // Asignar fechaPublicacion si existe
                        if (vacante.getFechaPublicacion() != null) {
                            resumen.setFechaPublicacion(vacante.getFechaPublicacion());
                        }
                        resumen.setEstado(vacante.getEstado());
                        
                        // Información del reclutador si está disponible
                        if (vacante.getReclutador() != null) {
                            resumen.setReclutadorId(vacante.getReclutador().getId());
                            resumen.setNombreReclutador(
                                vacante.getReclutador().getNombre() + " " + 
                                vacante.getReclutador().getApellido());
                        }
                        
                        // Campo de compatibilidad (opcional)
                        resumen.setCompatibilidad(100); // Al ser favorito, alta compatibilidad
                        
                        return resumen;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error al obtener vacantes favoritas: {}", e.getMessage(), e);
            return new ArrayList<>(); // Devolver lista vacía en caso de error
        }
    }

    @Override
    public List<CandidatoResponse> buscarPorTituloProfesional(String tituloProfesional) {
        return candidatoRepository.findByTituloProfesionalContainingIgnoreCase(tituloProfesional)
                .stream()
                .map(candidatoMapper::toCandidatoResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public Page<CandidatoResponse> buscarPorTituloProfesional(String tituloProfesional, Pageable pageable) {
        return candidatoRepository.findByTituloProfesionalContainingIgnoreCase(tituloProfesional, pageable)
                .map(candidatoMapper::toCandidatoResponse);
    }

    @Override
    public List<CandidatoResponse> buscarPorUbicacion(String ubicacion) {
        return candidatoRepository.findByUbicacionContainingIgnoreCase(ubicacion)
                .stream()
                .map(candidatoMapper::toCandidatoResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public Page<CandidatoResponse> buscarPorUbicacion(String ubicacion, Pageable pageable) {
        return candidatoRepository.findByUbicacionContainingIgnoreCase(ubicacion, pageable)
                .map(candidatoMapper::toCandidatoResponse);
    }

    @Override
    public List<CandidatoResponse> buscarPorHabilidad(String habilidad) {
        return candidatoRepository.findByHabilidadesPrincipalesContainingIgnoreCase(habilidad)
                .stream()
                .map(candidatoMapper::toCandidatoResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public Page<CandidatoResponse> buscarPorHabilidad(String habilidad, Pageable pageable) {
        return candidatoRepository.findByHabilidadesPrincipalesContainingIgnoreCase(habilidad, pageable)
                .map(candidatoMapper::toCandidatoResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidatoResponse> listarTodos() {
        List<Candidato> candidatos = candidatoRepository.findAll();
        return candidatos.stream()
                .map(candidatoMapper::toCandidatoResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Candidato buscarCandidatoPorId(Long id) {
        return candidatoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Candidato no encontrado con ID: " + id));
    }

    @Override
    public String generarUrlTemporalCurriculum(Long candidatoId) {
        Candidato candidato = buscarCandidatoPorId(candidatoId);
        
        if (candidato.getUrlCurriculum() == null || candidato.getUrlCurriculum().trim().isEmpty()) {
            throw new RecursoNoEncontradoException("El candidato no tiene currículum subido");
        }
        
        // Generar URL temporal para acceder al archivo
        return storageService.generarUrlTemporal(candidato.getUrlCurriculum(), 30); // 30 minutos
    }
    
    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public String actualizarFotoPerfil(Long id, MultipartFile fotoPerfil) {
        Candidato candidato = buscarCandidatoPorId(id);
        
        // Validar tipo de archivo
        String contentType = fotoPerfil.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("El archivo debe ser una imagen (JPEG, PNG, etc.)");
        }
        
        // Comprobar tamaño del archivo (máximo 5MB)
        if (fotoPerfil.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("La imagen no debe superar los 5MB");
        }
        
        // Eliminar foto anterior si existe y no es la foto por defecto (las fotos por defecto no se almacenan en nuestro servicio)
        if (candidato.getUrlFoto() != null && !candidato.getUrlFoto().contains("googleusercontent.com") && 
            !candidato.getUrlFoto().contains("github.com") && !candidato.getUrlFoto().contains("default-avatar")) {
            try {
                storageService.eliminarArchivo(candidato.getUrlFoto());
            } catch (Exception e) {
                log.warn("No se pudo eliminar la foto anterior: {}", e.getMessage());
                // Continuamos con el proceso aunque falle la eliminación
            }
        }
        
        // Guardar nueva foto
        String extension = obtenerExtensionArchivo(fotoPerfil.getOriginalFilename());
        String ruta = "fotos_perfil/candidatos/" + id;
        String archivoNombre = System.currentTimeMillis() + extension;
        
        String url = storageService.guardarArchivo(fotoPerfil, ruta, archivoNombre);
        
        // Actualizar URL en el candidato
        candidato.setUrlFoto(url);
        candidatoRepository.save(candidato);
        
        log.info("Foto de perfil actualizada para el candidato ID: {}", id);
        
        return url;
    }
    
    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public String eliminarFotoPerfil(Long id) {
        Candidato candidato = buscarCandidatoPorId(id);
        
        // Si tiene una foto personalizada, eliminarla
        if (candidato.getUrlFoto() != null && !candidato.getUrlFoto().contains("googleusercontent.com") && 
            !candidato.getUrlFoto().contains("github.com") && !candidato.getUrlFoto().contains("default-avatar")) {
            try {
                storageService.eliminarArchivo(candidato.getUrlFoto());
            } catch (Exception e) {
                log.warn("No se pudo eliminar la foto: {}", e.getMessage());
                // Continuamos con el proceso aunque falle la eliminación
            }
        }
        
        // Obtener la URL de la foto por defecto (basada en el método de autenticación original)
        String fotoDefault = obtenerFotoPorDefecto(candidato);
        
        // Actualizar URL en el candidato
        candidato.setUrlFoto(fotoDefault);
        candidatoRepository.save(candidato);
        
        log.info("Foto de perfil restablecida a la por defecto para el candidato ID: {}", id);
        
        return fotoDefault;
    }
    
    /**
     * Obtiene la extensión de un archivo.
     * 
     * @param nombreArchivo Nombre del archivo
     * @return Extensión del archivo con el punto incluido
     */
    private String obtenerExtensionArchivo(String nombreArchivo) {
        if (nombreArchivo == null || nombreArchivo.isEmpty()) {
            return ".jpg"; // Extensión por defecto
        }
        
        int indicePunto = nombreArchivo.lastIndexOf(".");
        if (indicePunto > 0) {
            return nombreArchivo.substring(indicePunto);
        }
        
        return ".jpg"; // Extensión por defecto
    }
    
    /**
     * Obtiene la URL de la foto por defecto según el método de autenticación original.
     * 
     * @param candidato Candidato para el que obtener la foto por defecto
     * @return URL de la foto por defecto
     */
    private String obtenerFotoPorDefecto(Candidato candidato) {
        log.info("Buscando foto por defecto para candidato ID: {}, Email: {}, OAuth2: {}", 
                candidato.getId(), candidato.getEmail(), candidato.getAutenticacionOAuth2());
        
        // Verificar si el candidato se autenticó con OAuth2
        Boolean autenticacionOAuth2 = candidato.getAutenticacionOAuth2();
        
        // PASO 1: Buscar directamente en la base de datos por el email
        try {
            String email = candidato.getEmail();
            if (email != null && !email.isEmpty()) {
                log.info("Buscando usuarios con el mismo email: {}", email);
                
                // Buscar todos los usuarios con el mismo email (incluyendo registros de autenticación OAuth2)
                List<Usuario> usuariosConMismoEmail = usuarioRepository.findByEmail(email)
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
                
                // Si no encontramos por findByEmail, intentamos con una búsqueda más amplia
                if (usuariosConMismoEmail.isEmpty()) {
                    usuariosConMismoEmail = usuarioRepository.findAll().stream()
                        .filter(u -> email.equals(u.getEmail()))
                        .collect(Collectors.toList());
                    log.info("Búsqueda amplia encontró {} usuarios con email {}", usuariosConMismoEmail.size(), email);
                }
                
                // Buscar primero usuarios con fotos de Google que contengan un ID real (no la URL genérica)
                for (Usuario u : usuariosConMismoEmail) {
                    if (u.getUrlFoto() != null && 
                        u.getUrlFoto().contains("googleusercontent.com") && 
                        !u.getUrlFoto().contains("default-user")) {
                        
                        String urlGoogle = u.getUrlFoto();
                        log.info("Encontrada foto de Google real para el usuario: {}", urlGoogle);
                        
                        // Asegurarse de que la URL de Google tenga el tamaño correcto
                        if (urlGoogle.contains("=")) {
                            String baseUrl = urlGoogle.split("=")[0];
                            urlGoogle = baseUrl + "=s400-c";
                        }
                        return urlGoogle;
                    }
                }
                
                // Si no encontramos una URL de Google real, buscar cualquier URL de Google
                for (Usuario u : usuariosConMismoEmail) {
                    if (u.getUrlFoto() != null && u.getUrlFoto().contains("googleusercontent.com")) {
                        String urlGoogle = u.getUrlFoto();
                        log.info("Encontrada foto de Google genérica para el usuario: {}", urlGoogle);
                        
                        // Asegurarse de que la URL de Google tenga el tamaño correcto
                        if (urlGoogle.contains("=")) {
                            String baseUrl = urlGoogle.split("=")[0];
                            urlGoogle = baseUrl + "=s400-c";
                        }
                        return urlGoogle;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error al buscar foto de Google en la base de datos: {}", e.getMessage());
        }
        
        // PASO 2: Verificar si hay una URL de foto guardada en el propio candidato
        if (candidato.getUrlFoto() != null) {
            String urlFoto = candidato.getUrlFoto();
            
            // Si es una URL de Google, asegurarse de que tenga el formato correcto
            if (urlFoto.contains("googleusercontent.com")) {
                log.info("Usando foto de Google existente en el candidato: {}", urlFoto);
                if (urlFoto.contains("=")) {
                    String baseUrl = urlFoto.split("=")[0];
                    return baseUrl + "=s400-c";
                }
                return urlFoto;
            }
            
            // Si es una URL de GitHub, usarla directamente
            if (urlFoto.contains("github.com")) {
                log.info("Usando foto de GitHub existente en el candidato");
                return urlFoto;
            }
        }
        
        // PASO 3: Si el candidato se autenticó con OAuth2, intentar reconstruir la URL de Google
        if (autenticacionOAuth2 != null && autenticacionOAuth2) {
            String email = candidato.getEmail();
            if (email != null && email.endsWith("@gmail.com")) {
                // Extraer el ID de usuario de Google del email
                String googleUserId = email.substring(0, email.indexOf('@'));
                log.info("Intentando reconstruir URL de foto de Google para usuario: {}", googleUserId);
                
                // Construir una URL de foto de Google basada en el ID de usuario
                // Esto es una solución alternativa y puede no funcionar en todos los casos
                String googlePhotoUrl = "https://lh3.googleusercontent.com/a/default-user";
                log.info("URL reconstruida de Google: {}", googlePhotoUrl);
                return googlePhotoUrl;
            }
        }
        
        // PASO 4: Si todo lo demás falla, usar la imagen por defecto genérica
        log.info("No se encontró foto de perfil de OAuth2, usando imagen por defecto");
        return "https://storage.googleapis.com/talentmatch-assets/default-avatar.png";
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CandidatoResponse> filtrarCandidatos(
            String tituloProfesional,
            String nombre,
            String habilidad,
            Integer experienciaMinima,
            String ubicacion,
            Boolean disponibilidadInmediata,
            Pageable pageable) {
        
        // Creamos una especificación dinámica para aplicar los filtros
        Specification<Candidato> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filtro por título profesional
            if (StringUtils.hasText(tituloProfesional)) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("tituloProfesional")),
                    "%" + tituloProfesional.toLowerCase() + "%"));
            }
            
            // Filtro por nombre
            if (StringUtils.hasText(nombre)) {
                String nombreLower = nombre.toLowerCase();
                Predicate nombrePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("nombre")),
                    "%" + nombreLower + "%");
                Predicate apellidoPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("apellido")),
                    "%" + nombreLower + "%");
                predicates.add(criteriaBuilder.or(nombrePredicate, apellidoPredicate));
            }
            
            // Filtro por habilidad
            if (StringUtils.hasText(habilidad)) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("habilidadesPrincipales")),
                    "%" + habilidad.toLowerCase() + "%"));
            }
            
            // Filtro por experiencia mínima
            if (experienciaMinima != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("experienciaAnios"), experienciaMinima));
            }
            
            // Filtro por ubicación
            if (StringUtils.hasText(ubicacion)) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("ubicacion")),
                    "%" + ubicacion.toLowerCase() + "%"));
            }
            
            // Filtro por disponibilidad inmediata
            if (disponibilidadInmediata != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("disponibilidadInmediata"), disponibilidadInmediata));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        // Aplicamos la especificación y la paginación
        Page<Candidato> candidatos = candidatoRepository.findAll(spec, pageable);
        
        // Mapeamos los resultados a DTOs
        return candidatos.map(candidatoMapper::toCandidatoResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public CandidatoResponse actualizarEstado(Long id, String estado) {
        try {
            log.info("Actualizando estado del candidato ID: {} a: {}", id, estado);
            
            Candidato candidato = buscarCandidatoPorId(id);
            
            // Validar estado
            if (estado == null || estado.trim().isEmpty()) {
                throw new IllegalArgumentException("El estado no puede estar vacío");
            }
            
            // Actualizar el estado del proceso (estado personalizado) como una propiedad
            candidato.setEstadoProceso(estado);
            
            // Actualizar fecha de modificación
            candidato.setFechaActualizacion(LocalDateTime.now());
            
            // Guardar el candidato actualizado
            candidato = candidatoRepository.save(candidato);
            
            log.info("Estado del candidato actualizado con éxito, ID: {}", candidato.getId());
            
            return candidatoMapper.toCandidatoResponse(candidato);
        } catch (Exception e) {
            log.error("Error al actualizar el estado del candidato ID: {}, Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Ha ocurrido un error al actualizar el estado del candidato: " + e.getMessage(), e);
        }
    }
} 