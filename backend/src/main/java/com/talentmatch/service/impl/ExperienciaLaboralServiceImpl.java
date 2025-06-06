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
import com.talentmatch.model.entity.ExperienciaLaboral;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.ExperienciaLaboralRepository;
import com.talentmatch.service.ExperienciaLaboralService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio para gestionar experiencias laborales de los candidatos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExperienciaLaboralServiceImpl implements ExperienciaLaboralService {

    private final ExperienciaLaboralRepository experienciaLaboralRepository;
    private final CandidatoRepository candidatoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPorCandidato(Long candidatoId) {
        verificarCandidatoExiste(candidatoId);
        
        List<ExperienciaLaboral> experiencias = experienciaLaboralRepository.findByCandidatoId(candidatoId);
        
        return experiencias.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buscarPorId(Long candidatoId, Long experienciaId) {
        ExperienciaLaboral experiencia = buscarExperiencia(candidatoId, experienciaId);
        return mapToResponse(experiencia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> crear(Long candidatoId, Map<String, Object> request) {
        Candidato candidato = verificarCandidatoExiste(candidatoId);
        
        // Extraer datos
        String position = (String) request.get("position");
        String company = (String) request.get("company");
        String location = (String) request.get("location");
        String startDateStr = (String) request.get("startDate");
        String endDateStr = (String) request.get("endDate");
        String description = (String) request.get("description");
        Boolean actual = request.get("actual") instanceof Boolean ? 
                (Boolean) request.get("actual") : false;
        
        // Validaciones
        if (position == null || position.trim().isEmpty()) {
            throw new IllegalArgumentException("El puesto es obligatorio");
        }
        
        if (company == null || company.trim().isEmpty()) {
            throw new IllegalArgumentException("La empresa es obligatoria");
        }
        
        // Convertir fechas
        LocalDate startDate = parseStringToLocalDate(startDateStr);
        LocalDate endDate = actual ? null : parseStringToLocalDate(endDateStr);
        
        // Crear entidad
        ExperienciaLaboral experiencia = ExperienciaLaboral.builder()
            .candidato(candidato)
            .position(position)
            .company(company)
            .location(location != null ? location : "")
            .startDate(startDate)
            .endDate(endDate)
            .description(description != null ? description : "")
            .build();
        
        try {
            ExperienciaLaboral experienciaGuardada = experienciaLaboralRepository.save(experiencia);
            log.info("Experiencia laboral creada correctamente para el candidato ID: {}", candidatoId);
            return mapToResponse(experienciaGuardada);
        } catch (Exception e) {
            log.error("Error al guardar experiencia laboral: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar experiencia laboral: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> actualizar(Long candidatoId, Long experienciaId, Map<String, Object> request) {
        ExperienciaLaboral experiencia = buscarExperiencia(candidatoId, experienciaId);
        
        // Extraer datos
        String position = (String) request.get("position");
        String company = (String) request.get("company");
        String location = (String) request.get("location");
        String startDateStr = (String) request.get("startDate");
        String endDateStr = (String) request.get("endDate");
        String description = (String) request.get("description");
        Boolean actual = request.get("actual") instanceof Boolean ? 
                (Boolean) request.get("actual") : null;
        
        // Actualizar campos si están presentes
        if (position != null && !position.trim().isEmpty()) {
            experiencia.setPosition(position);
        }
        
        if (company != null && !company.trim().isEmpty()) {
            experiencia.setCompany(company);
        }
        
        if (location != null) {
            experiencia.setLocation(location);
        }
        
        // Actualizar fechas si están presentes
        if (startDateStr != null) {
            LocalDate startDate = parseStringToLocalDate(startDateStr);
            experiencia.setStartDate(startDate);
        }
        
        if (actual != null) {
            // No hay campo "actual" en la entidad, pero podemos manejarlo con la fecha fin
            if (actual) {
                // Si es actual, la fecha fin debe ser nula
                experiencia.setEndDate(null);
            } else if (endDateStr != null) {
                // Si no es actual y se proporcionó fecha fin, actualizarla
                LocalDate endDate = parseStringToLocalDate(endDateStr);
                experiencia.setEndDate(endDate);
            }
        } else if (endDateStr != null) {
            // Si no se actualizó el campo actual pero se proporcionó fecha fin
            LocalDate endDate = parseStringToLocalDate(endDateStr);
            experiencia.setEndDate(endDate);
        }
        
        if (description != null) {
            experiencia.setDescription(description);
        }
        
        try {
            ExperienciaLaboral experienciaActualizada = experienciaLaboralRepository.save(experiencia);
            log.info("Experiencia laboral actualizada correctamente. ID: {}, candidato ID: {}", experienciaId, candidatoId);
            return mapToResponse(experienciaActualizada);
        } catch (Exception e) {
            log.error("Error al actualizar experiencia laboral: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar experiencia laboral: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void eliminar(Long candidatoId, Long experienciaId) {
        ExperienciaLaboral experiencia = buscarExperiencia(candidatoId, experienciaId);
        experienciaLaboralRepository.delete(experiencia);
        log.info("Experiencia laboral eliminada correctamente. ID: {}, candidato ID: {}", experienciaId, candidatoId);
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
     * Busca una experiencia laboral específica de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @return Entidad ExperienciaLaboral
     * @throws ResourceNotFoundException si la experiencia laboral no existe
     */
    private ExperienciaLaboral buscarExperiencia(Long candidatoId, Long experienciaId) {
        verificarCandidatoExiste(candidatoId);
        
        return experienciaLaboralRepository.findByIdAndCandidatoId(experienciaId, candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Experiencia laboral no encontrada con ID: " + experienciaId + " para el candidato ID: " + candidatoId));
    }
    
    /**
     * Mapea una entidad ExperienciaLaboral a su respuesta en formato Map.
     * 
     * @param experiencia Entidad ExperienciaLaboral
     * @return Map con la representación de la experiencia laboral
     */
    private Map<String, Object> mapToResponse(ExperienciaLaboral experiencia) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", experiencia.getId());
        response.put("candidatoId", experiencia.getCandidato().getId());
        response.put("position", experiencia.getPosition());
        response.put("company", experiencia.getCompany());
        response.put("location", experiencia.getLocation());
        
        // Formatear fechas si no son nulas
        if (experiencia.getStartDate() != null) {
            response.put("startDate", experiencia.getStartDate().toString());
        } else {
            response.put("startDate", "");
        }
        
        if (experiencia.getEndDate() != null) {
            response.put("endDate", experiencia.getEndDate().toString());
        } else {
            response.put("endDate", "");
        }
        
        // Determinar si es actual
        response.put("actual", experiencia.getEndDate() == null);
        response.put("description", experiencia.getDescription());
        
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