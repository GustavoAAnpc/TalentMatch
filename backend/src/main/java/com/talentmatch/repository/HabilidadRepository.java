package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Habilidad;

/**
 * Repositorio para la entidad Habilidad.
 */
@Repository
public interface HabilidadRepository extends JpaRepository<Habilidad, Long> {
    
    /**
     * Busca todas las habilidades de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de habilidades
     */
    List<Habilidad> findByCandidatoId(Long candidatoId);
    
    /**
     * Busca una habilidad específica de un candidato.
     * 
     * @param id ID de la habilidad
     * @param candidatoId ID del candidato
     * @return La habilidad si existe
     */
    Optional<Habilidad> findByIdAndCandidatoId(Long id, Long candidatoId);
    
    /**
     * Busca una habilidad por nombre para un candidato específico.
     * 
     * @param name Nombre de la habilidad
     * @param candidatoId ID del candidato
     * @return La habilidad si existe
     */
    Optional<Habilidad> findByNameAndCandidatoId(String name, Long candidatoId);
} 