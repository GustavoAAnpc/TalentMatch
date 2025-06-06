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
import com.talentmatch.model.entity.Certificacion;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.CertificacionRepository;
import com.talentmatch.service.CertificacionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio para gestionar certificaciones de los candidatos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CertificacionServiceImpl implements CertificacionService {

    private final CertificacionRepository certificacionRepository;
    private final CandidatoRepository candidatoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPorCandidato(Long candidatoId) {
        verificarCandidatoExiste(candidatoId);
        
        List<Certificacion> certificaciones = certificacionRepository.findByCandidatoId(candidatoId);
        
        return certificaciones.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buscarPorId(Long candidatoId, Long certificacionId) {
        Certificacion certificacion = buscarCertificacion(candidatoId, certificacionId);
        return mapToResponse(certificacion);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> crear(Long candidatoId, Map<String, Object> request) {
        Candidato candidato = verificarCandidatoExiste(candidatoId);
        
        // Extraer datos
        String name = (String) request.get("name");
        String issuer = (String) request.get("issuer");
        String dateStr = (String) request.get("date");
        String expiration = (String) request.get("expiration");
        
        // Validaciones
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la certificación es obligatorio");
        }
        
        if (issuer == null || issuer.trim().isEmpty()) {
            throw new IllegalArgumentException("La entidad emisora es obligatoria");
        }
        
        // Convertir fecha
        LocalDate date = parseStringToLocalDate(dateStr);
        
        // Crear entidad
        Certificacion certificacion = Certificacion.builder()
            .candidato(candidato)
            .name(name)
            .issuer(issuer)
            .date(date)
            .expiration(expiration != null ? expiration : "")
            .build();
        
        try {
            Certificacion certificacionGuardada = certificacionRepository.save(certificacion);
            log.info("Certificación creada correctamente para el candidato ID: {}", candidatoId);
            return mapToResponse(certificacionGuardada);
        } catch (Exception e) {
            log.error("Error al guardar certificación: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar certificación: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> actualizar(Long candidatoId, Long certificacionId, Map<String, Object> request) {
        Certificacion certificacion = buscarCertificacion(candidatoId, certificacionId);
        
        // Extraer datos
        String name = (String) request.get("name");
        String issuer = (String) request.get("issuer");
        String dateStr = (String) request.get("date");
        String expiration = (String) request.get("expiration");
        
        // Actualizar campos
        if (name != null && !name.trim().isEmpty()) {
            certificacion.setName(name);
        }
        
        if (issuer != null && !issuer.trim().isEmpty()) {
            certificacion.setIssuer(issuer);
        }
        
        // Convertir y actualizar fecha
        if (dateStr != null) {
            LocalDate date = parseStringToLocalDate(dateStr);
            certificacion.setDate(date);
        }
        
        if (expiration != null) {
            certificacion.setExpiration(expiration);
        }
        
        try {
            Certificacion certificacionActualizada = certificacionRepository.save(certificacion);
            log.info("Certificación actualizada correctamente. ID: {}, candidato ID: {}", certificacionId, candidatoId);
            return mapToResponse(certificacionActualizada);
        } catch (Exception e) {
            log.error("Error al actualizar certificación: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar certificación: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void eliminar(Long candidatoId, Long certificacionId) {
        Certificacion certificacion = buscarCertificacion(candidatoId, certificacionId);
        certificacionRepository.delete(certificacion);
        log.info("Certificación eliminada correctamente. ID: {}, candidato ID: {}", certificacionId, candidatoId);
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
     * Busca una certificación específica de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     * @return Entidad Certificacion
     * @throws ResourceNotFoundException si la certificación no existe
     */
    private Certificacion buscarCertificacion(Long candidatoId, Long certificacionId) {
        verificarCandidatoExiste(candidatoId);
        
        return certificacionRepository.findByIdAndCandidatoId(certificacionId, candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Certificación no encontrada con ID: " + certificacionId + " para el candidato ID: " + candidatoId));
    }
    
    /**
     * Mapea una entidad Certificacion a su respuesta en formato Map.
     * 
     * @param certificacion Entidad Certificacion
     * @return Map con la representación de la certificación
     */
    private Map<String, Object> mapToResponse(Certificacion certificacion) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", certificacion.getId());
        response.put("candidatoId", certificacion.getCandidato().getId());
        response.put("name", certificacion.getName());
        response.put("issuer", certificacion.getIssuer());
        
        // Formatear fecha si no es nula
        if (certificacion.getDate() != null) {
            response.put("date", certificacion.getDate().toString());
        } else {
            response.put("date", "");
        }
        
        response.put("expiration", certificacion.getExpiration());
        
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