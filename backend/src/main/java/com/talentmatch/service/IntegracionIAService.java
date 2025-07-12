package com.talentmatch.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * Interfaz para el servicio de integración con IA (Gemini API).
 */
public interface IntegracionIAService {

    /**
     * Analiza un currículum y extrae información relevante.
     * 
     * @param curriculum Archivo del currículum
     * @return Mapa con la información extraída del currículum
     */
    Map<String, Object> analizarCurriculum(MultipartFile curriculum);

    /**
     * Evalúa la compatibilidad entre un candidato y una vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return Porcentaje de compatibilidad y recomendaciones
     */
    Map<String, Object> evaluarCompatibilidad(Long candidatoId, Long vacanteId);

    /**
     * Genera preguntas para una prueba técnica basada en la vacante.
     * 
     * @param tituloVacante Título de la vacante
     * @param descripcionVacante Descripción de la vacante
     * @param habilidadesRequeridas Habilidades requeridas para la vacante
     * @param numPreguntas Número de preguntas a generar
     * @return Lista de preguntas generadas
     */
    List<String> generarPreguntasPruebaTecnica(String tituloVacante, String descripcionVacante, 
            String habilidadesRequeridas, int numPreguntas);

    /**
     * Evalúa las respuestas de una prueba técnica.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @return Mapa con la evaluación de cada respuesta y una puntuación general
     */
    Map<String, Object> evaluarRespuestasPruebaTecnica(Long pruebaTecnicaId);

    /**
     * Genera retroalimentación personalizada para un candidato.
     * 
     * @param postulacionId ID de la postulación
     * @return Retroalimentación generada
     */
    String generarRetroalimentacion(Long postulacionId);

    /**
     * Genera un ranking de candidatos para una vacante.
     * 
     * @param vacanteId ID de la vacante
     * @return Lista ordenada de candidatos con sus puntuaciones
     */
    List<Map<String, Object>> generarRankingCandidatos(Long vacanteId);

    /**
     * Sugiere mejoras para el perfil de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de sugerencias para mejorar el perfil
     */
    List<String> sugerirMejorasPerfil(Long candidatoId);

    /**
     * Sugiere vacantes para un candidato basado en su perfil.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de IDs de vacantes recomendadas con puntuación de compatibilidad
     */
    List<Map<String, Object>> sugerirVacantes(Long candidatoId);
    
    /**
     * Genera descripción y tecnologías para una prueba técnica basada en la vacante.
     * 
     * @param vacanteId ID de la vacante
     * @return Mapa con la descripción generada y las tecnologías
     */
    Map<String, String> generarDescripcionYTecnologias(Long vacanteId);
    
    /**
     * Genera descripción y tecnologías para una prueba técnica basada solo en el título.
     * Se usa cuando no hay una vacante asociada.
     * 
     * @param tituloPrueba Título de la prueba técnica
     * @return Mapa con la descripción generada y las tecnologías
     */
    Map<String, String> generarDescripcionYTecnologiasPorTitulo(String tituloPrueba);
    
    /**
     * Genera una pregunta para prueba técnica según el tipo especificado.
     * 
     * @param tipoPregunta Tipo de pregunta a generar (DESARROLLO, OPCION_MULTIPLE, VERDADERO_FALSO, CODIGO, etc.)
     * @param nivelDificultad Nivel de dificultad de la pregunta (BASICO, INTERMEDIO, AVANZADO)
     * @return Mapa con la pregunta generada, opciones y respuesta correcta si aplica
     */
    Map<String, Object> generarPregunta(String tipoPregunta, String nivelDificultad);
    
    /**
     * Envía una solicitud directa a Gemini API y devuelve la respuesta como texto.
     * 
     * @param prompt Texto de la solicitud a enviar a la API
     * @return Respuesta de Gemini como texto
     * @throws JsonProcessingException Si hay un error procesando el JSON
     */
    String enviarSolicitudGemini(String prompt) throws JsonProcessingException;
}
