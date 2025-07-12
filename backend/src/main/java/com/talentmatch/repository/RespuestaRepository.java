package com.talentmatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;

import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Pregunta;
import com.talentmatch.model.entity.Respuesta;

/**
 * Repositorio para la entidad Respuesta.
 */
@Repository
public interface RespuestaRepository extends JpaRepository<Respuesta, Long> {
    
    /**
     * Busca una respuesta por pregunta.
     * 
     * @param pregunta Pregunta asociada a la respuesta
     * @return Optional con la respuesta si existe, vacío en caso contrario
     */
    Optional<Respuesta> findByPregunta(Pregunta pregunta);
    
    /**
     * Verifica si existe una respuesta para una pregunta.
     * 
     * @param pregunta Pregunta a verificar
     * @return true si existe una respuesta para la pregunta, false en caso contrario
     */
    boolean existsByPregunta(Pregunta pregunta);
    
    /**
     * Busca respuestas por candidato.
     * 
     * @param candidato Candidato que realizó las respuestas
     * @return Lista de respuestas del candidato
     */
    List<Respuesta> findByCandidato(Candidato candidato);
    
    /**
     * Busca respuestas por candidato y pregunta.
     * 
     * @param candidato Candidato que realizó la respuesta
     * @param pregunta Pregunta respondida
     * @return Optional con la respuesta si existe, vacío en caso contrario
     */
    Optional<Respuesta> findByCandidatoAndPregunta(Candidato candidato, Pregunta pregunta);
    
    /**
     * Cuenta el número de respuestas por candidato.
     * 
     * @param candidato Candidato a contar sus respuestas
     * @return Número de respuestas del candidato
     */
    long countByCandidato(Candidato candidato);
    
    /**
     * Busca una respuesta por ID de pregunta.
     * 
     * @param preguntaId ID de la pregunta asociada a la respuesta
     * @return Optional con la respuesta si existe, vacío en caso contrario
     */
    @Query("SELECT r FROM Respuesta r WHERE r.pregunta.id = :preguntaId")
    Optional<Respuesta> findByPreguntaId(@Param("preguntaId") Long preguntaId);
    
    /**
     * Elimina respuestas por ID de pregunta.
     * 
     * @param preguntaId ID de la pregunta asociada a las respuestas a eliminar
     */
    @Modifying
    @Query("DELETE FROM Respuesta r WHERE r.pregunta.id = :preguntaId")
    void deleteByPreguntaId(@Param("preguntaId") Long preguntaId);
}
