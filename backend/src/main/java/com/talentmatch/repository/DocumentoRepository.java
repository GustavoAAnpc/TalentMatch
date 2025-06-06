package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Documento;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    
    List<Documento> findByCandidatoId(Long candidatoId);
    
    List<Documento> findByCandidatoIdAndTipo(Long candidatoId, String tipo);
    
    Optional<Documento> findByCandidatoIdAndEsPrincipalTrue(Long candidatoId);
    
    @Query("SELECT d FROM Documento d WHERE d.candidato.id = :candidatoId AND d.tipo = :tipo ORDER BY d.fechaCreacion DESC")
    List<Documento> findByCandidatoIdAndTipoOrderByFechaCreacionDesc(Long candidatoId, String tipo);
    
    boolean existsByCandidatoIdAndTipoAndNombre(Long candidatoId, String tipo, String nombre);
} 