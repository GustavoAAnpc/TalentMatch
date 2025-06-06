package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Idioma;

/**
 * Repositorio para la entidad Idioma.
 */
@Repository
public interface IdiomaRepository extends JpaRepository<Idioma, Long> {
    
    /**
     * Busca todos los idiomas de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de idiomas
     */
    List<Idioma> findByCandidatoId(Long candidatoId);
    
    /**
     * Busca un idioma específico de un candidato.
     * 
     * @param id ID del idioma
     * @param candidatoId ID del candidato
     * @return El idioma si existe
     */
    Optional<Idioma> findByIdAndCandidatoId(Long id, Long candidatoId);
    
    /**
     * Busca un idioma por nombre para un candidato específico.
     * 
     * @param name Nombre del idioma
     * @param candidatoId ID del candidato
     * @return El idioma si existe
     */
    Optional<Idioma> findByNameAndCandidatoId(String name, Long candidatoId);
} 