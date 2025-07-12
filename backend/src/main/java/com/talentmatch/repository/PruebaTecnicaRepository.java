package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.PruebaTecnica;
import com.talentmatch.model.entity.Reclutador;

/**
 * Repositorio para la entidad PruebaTecnica.
 */
@Repository
public interface PruebaTecnicaRepository extends JpaRepository<PruebaTecnica, Long> {
    
    /**
     * Busca una prueba técnica por postulación.
     * 
     * @param postulacion Postulación asociada a la prueba técnica
     * @return Optional con la prueba técnica si existe, vacío en caso contrario
     */
    Optional<PruebaTecnica> findByPostulacion(Postulacion postulacion);
    
    /**
     * Verifica si existe una prueba técnica para una postulación.
     * 
     * @param postulacion Postulación a verificar
     * @return true si existe una prueba técnica para la postulación, false en caso contrario
     */
    boolean existsByPostulacion(Postulacion postulacion);
    
    /**
     * Busca pruebas técnicas por reclutador.
     * 
     * @param reclutador Reclutador que creó las pruebas técnicas
     * @return Lista de pruebas técnicas creadas por el reclutador
     */
    List<PruebaTecnica> findByReclutador(Reclutador reclutador);
    
    /**
     * Busca pruebas técnicas por estado de completitud.
     * 
     * @param completada Estado de completitud de las pruebas técnicas
     * @return Lista de pruebas técnicas con el estado de completitud especificado
     */
    List<PruebaTecnica> findByCompletada(Boolean completada);
    
    /**
     * Busca pruebas técnicas por reclutador y estado de completitud.
     * 
     * @param reclutador Reclutador que creó las pruebas técnicas
     * @param completada Estado de completitud de las pruebas técnicas
     * @return Lista de pruebas técnicas creadas por el reclutador con el estado de completitud especificado
     */
    List<PruebaTecnica> findByReclutadorAndCompletada(Reclutador reclutador, Boolean completada);
    
    /**
     * Busca pruebas técnicas por nivel de dificultad.
     * 
     * @param nivelDificultad Nivel de dificultad de las pruebas técnicas
     * @return Lista de pruebas técnicas con el nivel de dificultad especificado
     */
    List<PruebaTecnica> findByNivelDificultad(String nivelDificultad);
    
    /**
     * Busca pruebas técnicas por tecnologías.
     * 
     * @param tecnologias Tecnologías de las pruebas técnicas
     * @return Lista de pruebas técnicas que incluyen las tecnologías especificadas
     */
    List<PruebaTecnica> findByTecnologiasContainingIgnoreCase(String tecnologias);
    
    /**
     * Busca pruebas técnicas por ID de reclutador.
     * 
     * @param reclutadorId ID del reclutador que creó las pruebas técnicas
     * @return Lista de pruebas técnicas creadas por el reclutador con el ID especificado
     */
    @Query("SELECT pt FROM PruebaTecnica pt WHERE pt.reclutador.id = :reclutadorId")
    List<PruebaTecnica> findByReclutadorId(@Param("reclutadorId") Long reclutadorId);
    
    /**
     * Busca pruebas técnicas por ID de candidato en postulación.
     * 
     * @param candidatoId ID del candidato asociado a las postulaciones
     * @return Lista de pruebas técnicas asociadas a las postulaciones del candidato con el ID especificado
     */
    @Query("SELECT pt FROM PruebaTecnica pt WHERE pt.postulacion.candidato.id = :candidatoId")
    List<PruebaTecnica> findByPostulacionCandidatoId(@Param("candidatoId") Long candidatoId);
    
    /**
     * Busca pruebas técnicas por ID de vacante.
     * 
     * @param vacanteId ID de la vacante asociada a las pruebas técnicas
     * @return Lista de pruebas técnicas asociadas a la vacante con el ID especificado
     */
    @Query("SELECT pt FROM PruebaTecnica pt WHERE pt.vacante.id = :vacanteId")
    List<PruebaTecnica> findByVacanteId(@Param("vacanteId") Long vacanteId);
    
    /**
     * Busca pruebas técnicas por ID de candidato en postulación y estado de completitud.
     * 
     * @param candidatoId ID del candidato asociado a las postulaciones
     * @param completada Estado de completitud de las pruebas técnicas
     * @return Lista de pruebas técnicas asociadas a las postulaciones del candidato con el ID y estado de completitud especificados
     */
    @Query("SELECT pt FROM PruebaTecnica pt WHERE pt.postulacion.candidato.id = :candidatoId AND pt.completada = :completada")
    List<PruebaTecnica> findByPostulacionCandidatoIdAndCompletada(
            @Param("candidatoId") Long candidatoId,
            @Param("completada") boolean completada);
}
