package com.talentmatch.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.exception.ResourceNotFoundException;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Idioma;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.IdiomaRepository;
import com.talentmatch.service.IdiomaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio para gestionar idiomas de los candidatos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdiomaServiceImpl implements IdiomaService {

    private final IdiomaRepository idiomaRepository;
    private final CandidatoRepository candidatoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPorCandidato(Long candidatoId) {
        verificarCandidatoExiste(candidatoId);
        
        List<Idioma> idiomas = idiomaRepository.findByCandidatoId(candidatoId);
        
        return idiomas.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buscarPorId(Long candidatoId, Long idiomaId) {
        Idioma idioma = buscarIdioma(candidatoId, idiomaId);
        return mapToResponse(idioma);
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
        String level = (String) request.get("level");
        
        // Validaciones
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del idioma es obligatorio");
        }
        
        if (level == null || level.trim().isEmpty()) {
            throw new IllegalArgumentException("El nivel de dominio es obligatorio");
        }
        
        // Verificar si ya existe un idioma con el mismo nombre
        idiomaRepository.findByNameAndCandidatoId(name, candidatoId)
            .ifPresent(i -> {
                throw new IllegalArgumentException("Ya existe un idioma con el nombre: " + name);
            });
        
        // Crear entidad
        Idioma idioma = Idioma.builder()
            .candidato(candidato)
            .name(name)
            .level(level)
            .build();
        
        try {
            Idioma idiomaGuardado = idiomaRepository.save(idioma);
            log.info("Idioma creado correctamente para el candidato ID: {}", candidatoId);
            return mapToResponse(idiomaGuardado);
        } catch (Exception e) {
            log.error("Error al guardar idioma: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar idioma: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public Map<String, Object> actualizar(Long candidatoId, Long idiomaId, Map<String, Object> request) {
        Idioma idioma = buscarIdioma(candidatoId, idiomaId);
        
        // Extraer datos
        String name = (String) request.get("name");
        String level = (String) request.get("level");
        
        // Validaciones y actualización
        if (name != null && !name.trim().isEmpty() && !name.equals(idioma.getName())) {
            // Verificar si ya existe otro idioma con el mismo nombre
            idiomaRepository.findByNameAndCandidatoId(name, candidatoId)
                .ifPresent(i -> {
                    if (!i.getId().equals(idiomaId)) {
                        throw new IllegalArgumentException("Ya existe otro idioma con el nombre: " + name);
                    }
                });
            
            idioma.setName(name);
        }
        
        if (level != null && !level.trim().isEmpty()) {
            idioma.setLevel(level);
        }
        
        try {
            Idioma idiomaActualizado = idiomaRepository.save(idioma);
            log.info("Idioma actualizado correctamente. ID: {}, candidato ID: {}", idiomaId, candidatoId);
            return mapToResponse(idiomaActualizado);
        } catch (Exception e) {
            log.error("Error al actualizar idioma: {}", e.getMessage(), e);
            throw new RuntimeException("Error al actualizar idioma: " + e.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void eliminar(Long candidatoId, Long idiomaId) {
        Idioma idioma = buscarIdioma(candidatoId, idiomaId);
        idiomaRepository.delete(idioma);
        log.info("Idioma eliminado correctamente. ID: {}, candidato ID: {}", idiomaId, candidatoId);
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
     * Busca un idioma específico de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     * @return Entidad Idioma
     * @throws ResourceNotFoundException si el idioma no existe
     */
    private Idioma buscarIdioma(Long candidatoId, Long idiomaId) {
        verificarCandidatoExiste(candidatoId);
        
        return idiomaRepository.findByIdAndCandidatoId(idiomaId, candidatoId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Idioma no encontrado con ID: " + idiomaId + " para el candidato ID: " + candidatoId));
    }
    
    /**
     * Mapea una entidad Idioma a su respuesta en formato Map.
     * 
     * @param idioma Entidad Idioma
     * @return Map con la representación del idioma
     */
    private Map<String, Object> mapToResponse(Idioma idioma) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", idioma.getId());
        response.put("candidatoId", idioma.getCandidato().getId());
        response.put("name", idioma.getName());
        response.put("level", idioma.getLevel());
        
        return response;
    }
} 