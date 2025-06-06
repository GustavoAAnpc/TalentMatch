package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Educacion;

/**
 * Repositorio para la entidad Educacion.
 */
@Repository
public interface EducacionRepository extends JpaRepository<Educacion, Long> {
    
    /**
     * Busca todas las educaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de educaciones
     */
    List<Educacion> findByCandidatoId(Long candidatoId);
    
    /**
     * Busca una educación específica de un candidato.
     * 
     * @param id ID de la educación
     * @param candidatoId ID del candidato
     * @return La educación si existe
     */
    Optional<Educacion> findByIdAndCandidatoId(Long id, Long candidatoId);
} 