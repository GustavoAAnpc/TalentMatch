package com.talentmatch.service.impl;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.exception.ResourceNotFoundException;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Educacion;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.EducacionRepository;
import com.talentmatch.service.EducacionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio para gestionar la educación de los candidatos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EducacionServiceImpl implements EducacionService {

    private final EducacionRepository educacionRepository;
    private final CandidatoRepository candidatoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPorCandidato(Long candidatoId) {
        verificarCandidatoExiste(candidatoId);
        
        List<Educacion> educaciones = educacionRepository.findByCandidatoId(candidatoId);
        
        return educaciones.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buscarPorId(Long candidatoId, Long educacionId) {
        Educacion educacion = buscarEducacion(candidatoId, educacionId);
        return mapToResponse(educacion);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> crear(Long candidatoId, Map<String, Object> request) {
        Candidato candidato = verificarCandidatoExiste(candidatoId);
        
        // Extraer datos
        String degree = (String) request.get("degree");
        String institution = (String) request.get("institution");
        String location = (String) request.get("location");
        String startDateStr = (String) request.get("startDate");
        String endDateStr = (String) request.get("endDate");
        String description = (String) request.get("description");
        
        // Convertir fechas
        LocalDate startDate = parseStringToLocalDate(startDateStr);
        LocalDate endDate = parseStringToLocalDate(endDateStr);
        
        // Crear entidad
        Educacion educacion = Educacion.builder()
            .candidato(candidato)
            .degree(degree)
            .institution(institution)
            .location(location != null ? location : "")
            .startDate(startDate)
            .endDate(endDate)
            .description(description != null ? description : "")
            .build();
        
        try {
            Educacion educacionGuardada = educacionRepository.save(educacion);
            log.info("Educación creada correctamente para el candidato ID: {}", candidatoId);
            return mapToResponse(educacionGuardada);
        } catch (Exception e) {
            log.error("Error al guardar educación: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar educación: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> actualizar(Long candidatoId, Long educacionId, Map<String, Object> request) {
        Educacion educacion = buscarEducacion(candidatoId, educacionId);
        
        // Extraer datos
        String degree = (String) request.get("degree");
        String institution = (String) request.get("institution");
        String location = (String) request.get("location");
        String startDateStr = (String) request.get("startDate");
        String endDateStr = (String) request.get("endDate");
        String description = (String) request.get("description");
        
        // Convertir fechas
        LocalDate startDate = parseStringToLocalDate(startDateStr);
        LocalDate endDate = parseStringToLocalDate(endDateStr);
        
        // Actualizar entidad
        if (degree != null) {
            educacion.setDegree(degree);
        }
        
        if (institution != null) {
            educacion.setInstitution(institution);
        }
        
        if (location != null) {
            educacion.setLocation(location);
        } else {
            educacion.setLocation("");
        }
        
        educacion.setStartDate(startDate);
        educacion.setEndDate(endDate);
        
        if (description != null) {
            educacion.setDescription(description);
        } else {
            educacion.setDescription("");
        }
        
        try {
            Educacion educacionActualizada = educacionRepository.save(educacion);
            log.info("Educación actualizada correctamente. ID: {}, candidato ID: {}", educacionId, candidatoId);
            return mapToResponse(educacionActualizada);
        } catch (Exception e) {
            log.error("Error al actualizar educación: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar educación: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void eliminar(Long candidatoId, Long educacionId) {
        Educacion educacion = buscarEducacion(candidatoId, educacionId);
        educacionRepository.delete(educacion);
        log.info("Educación eliminada correctamente. ID: {}, candidato ID: {}", educacionId, candidatoId);
    }
    
    /**
     * Verifica que el candidato exista y devuelve la entidad.
     * 
     * @param candidatoId ID del candidato
     * @return Entidad Candidato
     * @throws ResourceNotFoundException si el candidato no existe
     */
    private Candidato verificarCandidatoExiste(Long candidatoId) {
        return candidatoRepository.findById(candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + candidatoId));
    }
    
    /**
     * Busca una educación específica de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     * @return Entidad Educacion
     * @throws ResourceNotFoundException si la educación no existe
     */
    private Educacion buscarEducacion(Long candidatoId, Long educacionId) {
        verificarCandidatoExiste(candidatoId);
        
        return educacionRepository.findByIdAndCandidatoId(educacionId, candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Educación no encontrada con ID: " + educacionId + " para el candidato ID: " + candidatoId));
    }
    
    /**
     * Mapea una entidad Educacion a su respuesta en formato Map.
     * 
     * @param educacion Entidad Educacion
     * @return Map con la representación de la educación
     */
    private Map<String, Object> mapToResponse(Educacion educacion) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", educacion.getId());
        response.put("candidatoId", educacion.getCandidato().getId());
        response.put("degree", educacion.getDegree());
        response.put("institution", educacion.getInstitution());
        response.put("location", educacion.getLocation());
        
        // Formatear fechas si no son nulas
        if (educacion.getStartDate() != null) {
            response.put("startDate", educacion.getStartDate().toString());
        } else {
            response.put("startDate", "");
        }
        
        if (educacion.getEndDate() != null) {
            response.put("endDate", educacion.getEndDate().toString());
        } else {
            response.put("endDate", "");
        }
        
        response.put("description", educacion.getDescription());
        
        return response;
    }
    
    /**
     * Convierte una cadena de fecha en formato ISO (YYYY-MM-DD) a LocalDate.
     * 
     * @param dateString Cadena de fecha
     * @return LocalDate convertido o null si la cadena es inválida
     */
    private LocalDate parseStringToLocalDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Intentar parsear directamente si está en formato ISO (YYYY-MM-DD)
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
            return LocalDate.parse(dateString, formatter);
        } catch (DateTimeParseException e) {
            log.warn("No se pudo parsear la fecha '{}': {}", dateString, e.getMessage());
            
            // Si contiene "presente" o "actual", devolver fecha actual
            if (dateString.toLowerCase().contains("presente") || dateString.toLowerCase().contains("actual")) {
                return LocalDate.now();
            }
            
            // Intentar extraer año (19XX o 20XX)
            java.util.regex.Pattern yearPattern = java.util.regex.Pattern.compile("\\b(19|20)\\d{2}\\b");
            java.util.regex.Matcher matcher = yearPattern.matcher(dateString);
            if (matcher.find()) {
                int year = Integer.parseInt(matcher.group());
                return LocalDate.of(year, 1, 1);
            }
            
            return null;
        }
    }
} 