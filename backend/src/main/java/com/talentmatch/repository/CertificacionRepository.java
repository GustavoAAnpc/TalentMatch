package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Certificacion;

/**
 * Repositorio para la entidad Certificacion.
 */
@Repository
public interface CertificacionRepository extends JpaRepository<Certificacion, Long> {
    
    /**
     * Busca todas las certificaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de certificaciones
     */
    List<Certificacion> findByCandidatoId(Long candidatoId);
    
    /**
     * Busca una certificación específica de un candidato.
     * 
     * @param id ID de la certificación
     * @param candidatoId ID del candidato
     * @return La certificación si existe
     */
    Optional<Certificacion> findByIdAndCandidatoId(Long id, Long candidatoId);
} 