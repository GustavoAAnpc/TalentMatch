package com.talentmatch.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.exception.ResourceNotFoundException;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Habilidad;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.HabilidadRepository;
import com.talentmatch.service.HabilidadService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio para gestionar habilidades de los candidatos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HabilidadServiceImpl implements HabilidadService {

    private final HabilidadRepository habilidadRepository;
    private final CandidatoRepository candidatoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPorCandidato(Long candidatoId) {
        verificarCandidatoExiste(candidatoId);
        
        List<Habilidad> habilidades = habilidadRepository.findByCandidatoId(candidatoId);
        
        return habilidades.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buscarPorId(Long candidatoId, Long habilidadId) {
        Habilidad habilidad = buscarHabilidad(candidatoId, habilidadId);
        return mapToResponse(habilidad);
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
        Integer level = request.get("level") instanceof Number ? 
                        ((Number) request.get("level")).intValue() : null;
        
        // Validaciones
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la habilidad es obligatorio");
        }
        
        if (level == null || level < 1 || level > 100) {
            level = 50; // Valor por defecto si no es válido
        }
        
        // Verificar si ya existe una habilidad con el mismo nombre
        habilidadRepository.findByNameAndCandidatoId(name, candidatoId)
            .ifPresent(h -> {
                throw new IllegalArgumentException("Ya existe una habilidad con el nombre: " + name);
            });
        
        // Crear entidad
        Habilidad habilidad = Habilidad.builder()
            .candidato(candidato)
            .name(name)
            .level(level)
            .build();
        
        try {
            Habilidad habilidadGuardada = habilidadRepository.save(habilidad);
            log.info("Habilidad creada correctamente para el candidato ID: {}", candidatoId);
            return mapToResponse(habilidadGuardada);
        } catch (Exception e) {
            log.error("Error al guardar habilidad: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar habilidad: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> actualizar(Long candidatoId, Long habilidadId, Map<String, Object> request) {
        Habilidad habilidad = buscarHabilidad(candidatoId, habilidadId);
        
        // Extraer datos
        String name = (String) request.get("name");
        Integer level = request.get("level") instanceof Number ? 
                        ((Number) request.get("level")).intValue() : null;
        
        // Validaciones
        if (name != null && !name.trim().isEmpty() && !name.equals(habilidad.getName())) {
            // Verificar si ya existe otra habilidad con el mismo nombre
            habilidadRepository.findByNameAndCandidatoId(name, candidatoId)
                .ifPresent(h -> {
                    if (!h.getId().equals(habilidadId)) {
                        throw new IllegalArgumentException("Ya existe otra habilidad con el nombre: " + name);
                    }
                });
            
            habilidad.setName(name);
        }
        
        if (level != null) {
            if (level < 1) {
                level = 1;
            } else if (level > 100) {
                level = 100;
            }
            
            habilidad.setLevel(level);
        }
        
        try {
            Habilidad habilidadActualizada = habilidadRepository.save(habilidad);
            log.info("Habilidad actualizada correctamente. ID: {}, candidato ID: {}", habilidadId, candidatoId);
            return mapToResponse(habilidadActualizada);
        } catch (Exception e) {
            log.error("Error al actualizar habilidad: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar habilidad: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void eliminar(Long candidatoId, Long habilidadId) {
        Habilidad habilidad = buscarHabilidad(candidatoId, habilidadId);
        habilidadRepository.delete(habilidad);
        log.info("Habilidad eliminada correctamente. ID: {}, candidato ID: {}", habilidadId, candidatoId);
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
     * Busca una habilidad específica de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     * @return Entidad Habilidad
     * @throws ResourceNotFoundException si la habilidad no existe
     */
    private Habilidad buscarHabilidad(Long candidatoId, Long habilidadId) {
        verificarCandidatoExiste(candidatoId);
        
        return habilidadRepository.findByIdAndCandidatoId(habilidadId, candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Habilidad no encontrada con ID: " + habilidadId + " para el candidato ID: " + candidatoId));
    }
    
    /**
     * Mapea una entidad Habilidad a su respuesta en formato Map.
     * 
     * @param habilidad Entidad Habilidad
     * @return Map con la representación de la habilidad
     */
    private Map<String, Object> mapToResponse(Habilidad habilidad) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", habilidad.getId());
        response.put("candidatoId", habilidad.getCandidato().getId());
        response.put("name", habilidad.getName());
        response.put("level", habilidad.getLevel());
        
        return response;
    }
} 