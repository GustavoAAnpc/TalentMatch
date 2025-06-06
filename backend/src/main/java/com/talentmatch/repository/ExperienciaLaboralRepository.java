package com.talentmatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.ExperienciaLaboral;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la entidad ExperienciaLaboral.
 */
@Repository
public interface ExperienciaLaboralRepository extends JpaRepository<ExperienciaLaboral, Long> {
    
    /**
     * Encuentra todas las experiencias laborales de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de experiencias laborales
     */
    List<ExperienciaLaboral> findByCandidatoId(Long candidatoId);
    
    /**
     * Encuentra una experiencia laboral específica de un candidato.
     * 
     * @param id ID de la experiencia laboral
     * @param candidatoId ID del candidato
     * @return Experiencia laboral encontrada o vacío
     */
    Optional<ExperienciaLaboral> findByIdAndCandidatoId(Long id, Long candidatoId);
    
    /**
     * Elimina todas las experiencias laborales de un candidato.
     * 
     * @param candidatoId ID del candidato
     */
    void deleteByCandidatoId(Long candidatoId);
} 