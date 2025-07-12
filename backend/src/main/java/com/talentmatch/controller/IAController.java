package com.talentmatch.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.AnalisisPerfilRequest;
import com.talentmatch.dto.response.AnalisisPerfilResponse;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.dto.response.EmparejamientoResponse;
import com.talentmatch.dto.response.VacanteResumenResponse;
import com.talentmatch.exception.IAException;
import com.talentmatch.service.IAService;
import com.talentmatch.service.IntegracionIAService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controlador REST para el servicio de IA.
 */
@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IAController {

    private final IAService iaService;
    private final IntegracionIAService integracionIAService;
    private static final Logger log = LoggerFactory.getLogger(IAController.class);

    /**
     * Analiza el CV de un candidato.
     * 
     * @param curriculum Archivo del CV a analizar
     * @return ResponseEntity con el mapa de resultados del análisis
     */
    @PostMapping("/analizar-cv")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> analizarCurriculum(
            @RequestParam("archivo") MultipartFile curriculum) {
        return ResponseEntity.ok(integracionIAService.analizarCurriculum(curriculum));
    }

    /**
     * Calcula el emparejamiento entre un candidato y una vacante.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId   ID de la vacante
     * @return ResponseEntity con el resultado del emparejamiento
     */
    @GetMapping("/emparejamiento")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<EmparejamientoResponse> calcularEmparejamiento(
            @RequestParam Long candidatoId,
            @RequestParam Long vacanteId) {
        return ResponseEntity.ok(iaService.calcularEmparejamiento(candidatoId, vacanteId));
    }

    /**
     * Recomienda vacantes para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param limite      Número máximo de vacantes a recomendar
     * @return ResponseEntity con la lista de vacantes recomendadas
     */
    @GetMapping("/candidatos/{candidatoId}/vacantes-recomendadas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<VacanteResumenResponse>> recomendarVacantes(
            @PathVariable Long candidatoId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.recomendarVacantes(candidatoId, limite));
    }

    /**
     * Recomienda candidatos para una vacante.
     * 
     * @param vacanteId    ID de la vacante
     * @param reclutadorId ID del reclutador que solicita la recomendación
     * @param limite       Número máximo de candidatos a recomendar
     * @return ResponseEntity con la lista de candidatos recomendados
     */
    @GetMapping("/vacantes/{vacanteId}/candidatos-recomendados")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<CandidatoResponse>> recomendarCandidatos(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.recomendarCandidatos(vacanteId, limite));
    }

    /**
     * Genera preguntas para una prueba técnica basada en una vacante.
     * 
     * @param tituloVacante         Título de la vacante
     * @param descripcionVacante    Descripción de la vacante
     * @param habilidadesRequeridas Habilidades requeridas
     * @param numPreguntas          Número de preguntas a generar
     * @return ResponseEntity con la lista de preguntas generadas
     */
    @GetMapping("/generar-preguntas")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<List<String>> generarPreguntasPruebaTecnica(
            @RequestParam String tituloVacante,
            @RequestParam String descripcionVacante,
            @RequestParam String habilidadesRequeridas,
            @RequestParam(defaultValue = "5") int numPreguntas) {
        return ResponseEntity.ok(integracionIAService.generarPreguntasPruebaTecnica(
                tituloVacante, descripcionVacante, habilidadesRequeridas, numPreguntas));
    }

    /**
     * Evalúa las respuestas de una prueba técnica.
     * 
     * @param pruebaTecnicaId ID de la prueba técnica
     * @param reclutadorId    ID del reclutador que solicita la evaluación
     * @return ResponseEntity con el mapa de resultados de la evaluación
     */
    @GetMapping("/evaluar-respuestas/{pruebaTecnicaId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> evaluarRespuestasPruebaTecnica(
            @PathVariable Long pruebaTecnicaId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.evaluarRespuestasPruebaTecnica(pruebaTecnicaId));
    }

    /**
     * Genera retroalimentación para un candidato sobre su postulación.
     * 
     * @param postulacionId ID de la postulación
     * @param reclutadorId  ID del reclutador que solicita la retroalimentación
     * @return ResponseEntity con la retroalimentación generada
     */
    @GetMapping("/generar-retroalimentacion/{postulacionId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> generarRetroalimentacion(
            @PathVariable Long postulacionId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.generarRetroalimentacion(postulacionId));
    }

    /**
     * Sugiere mejoras para el perfil de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de sugerencias
     */
    @GetMapping("/sugerir-mejoras-perfil/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<String>> sugerirMejorasPerfil(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(integracionIAService.sugerirMejorasPerfil(candidatoId));
    }

    /**
     * Analiza el perfil de un candidato y genera recomendaciones.
     * 
     * @param request DTO con la información para el análisis
     * @return ResponseEntity con el resultado del análisis
     */
    @PostMapping("/analizar-perfil")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<AnalisisPerfilResponse> analizarPerfil(
            @Valid @RequestBody AnalisisPerfilRequest request) {
        return ResponseEntity.ok(iaService.analizarPerfil(request));
    }

    /**
     * Genera una descripción optimizada para una vacante.
     * 
     * @param vacanteId    ID de la vacante
     * @param reclutadorId ID del reclutador que solicita la descripción
     * @return ResponseEntity con la descripción generada
     */
    @GetMapping("/generar-descripcion-vacante/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> generarDescripcionVacante(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(iaService.generarDescripcionVacante(vacanteId));
    }

    /**
     * Genera una descripción de vacante basada en parámetros sin requerir una
     * vacante existente.
     * 
     * @param request Parámetros para generar la descripción
     * @return ResponseEntity con la descripción generada
     */
    @PostMapping("/generar-descripcion-parametrizada")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<String> generarDescripcionParametrizada(
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(iaService.generarDescripcionParametrizada(request));
    }

    /**
     * Genera contenido completo para una vacante (descripción, requisitos,
     * beneficios y habilidades).
     * 
     * @param request Parámetros para generar el contenido
     * @return ResponseEntity con el texto estructurado
     */
    @PostMapping("/generar-contenido-completo")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Object> generarContenidoCompleto(
            @RequestBody Map<String, Object> request) {
        try {
            log.info("Recibida solicitud para generar contenido completo: {}", request);
            String resultado = iaService.generarContenidoCompleto(request);

            if (resultado == null || resultado.trim().isEmpty()) {
                log.warn("La respuesta generada está vacía");
                return ResponseEntity.ok("Error: No se pudo generar contenido");
            }

            // Verificar si la respuesta ya es un JSON válido
            if (!(resultado.trim().startsWith("{") && resultado.trim().endsWith("}"))) {
                log.warn("La respuesta no tiene formato JSON, intentando transformar");

                // Si no es JSON, intentar transformar en un formato JSON simple
                try {
                    // Analizar el texto para extraer secciones
                    String descripcion = extraerSeccion(resultado, "DESCRIPCION");
                    String requisitos = extraerSeccion(resultado, "REQUISITOS");
                    String beneficios = extraerSeccion(resultado, "BENEFICIOS");
                    String habilidades = extraerSeccion(resultado, "HABILIDADES");

                    // Crear un JSON con las secciones extraídas
                    resultado = String.format(
                            "{\"descripcion\":\"%s\",\"requisitos\":\"%s\",\"beneficios\":\"%s\",\"habilidades\":[%s]}",
                            escaparJSON(descripcion),
                            escaparJSON(requisitos),
                            escaparJSON(beneficios),
                            procesarHabilidades(habilidades));

                    log.info("Respuesta transformada a JSON correctamente");
                } catch (Exception e) {
                    log.error("Error al transformar respuesta a JSON: {}", e.getMessage());
                }
            }

            log.info("Contenido completo generado exitosamente (longitud: {} caracteres)", resultado.length());
            // Registrar el contenido para propósitos de depuración
            if (log.isDebugEnabled()) {
                log.debug("Contenido generado: {}", resultado);
            }

            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Error al generar contenido completo: {}", e.getMessage(), e);
            // Dejar que el manejador global de excepciones maneje el error
            throw new IAException("Generación de contenido completo", e.getMessage());
        }
    }

    /**
     * Extrae una sección específica de un texto.
     * 
     * @param texto         Texto completo
     * @param nombreSeccion Nombre de la sección a extraer
     * @return Contenido de la sección
     */
    private String extraerSeccion(String texto, String nombreSeccion) {
        // Patrones comunes para secciones
        String[] patrones = {
                "\\[" + nombreSeccion + "\\](.*?)(?=\\[|$)",
                nombreSeccion + ":(.*?)(?=\\w+:|$)",
                nombreSeccion + "(.*?)(?=\\w+|$)"
        };

        for (String patron : patrones) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(patron,
                    java.util.regex.Pattern.CASE_INSENSITIVE | java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher matcher = pattern.matcher(texto);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        }

        return "";
    }

    /**
     * Escapa caracteres especiales para formato JSON.
     * 
     * @param texto Texto a escapar
     * @return Texto escapado
     */
    private String escaparJSON(String texto) {
        if (texto == null)
            return "";
        return texto.replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Procesa las habilidades para convertirlas en formato de array JSON.
     * 
     * @param textoHabilidades Texto con las habilidades
     * @return String con formato de array JSON
     */
    private String procesarHabilidades(String textoHabilidades) {
        if (textoHabilidades == null || textoHabilidades.trim().isEmpty()) {
            return "[]";
        }

        String[] habilidades;
        // Intentar dividir por comas
        if (textoHabilidades.contains(",")) {
            habilidades = textoHabilidades.split(",");
        }
        // Intentar dividir por líneas o guiones
        else if (textoHabilidades.contains("\n") || textoHabilidades.contains("-")) {
            habilidades = textoHabilidades.split("[\n-]");
        }
        // Si no hay separadores claros, considerar como una sola habilidad
        else {
            habilidades = new String[] { textoHabilidades };
        }

        // Formatear las habilidades como elementos de un array JSON
        StringBuilder jsonArray = new StringBuilder();
        for (int i = 0; i < habilidades.length; i++) {
            String habilidad = habilidades[i].trim();
            if (habilidad.isEmpty() || habilidad.equals("-"))
                continue;

            // Limpiar la habilidad de caracteres no deseados
            habilidad = habilidad.replaceAll("^[•\\-\\*\\+]\\s*", "");

            if (i > 0)
                jsonArray.append(",");
            jsonArray.append("\"").append(escaparJSON(habilidad)).append("\"");
        }

        return jsonArray.toString();
    }

    /**
     * Genera un ranking de candidatos para una vacante específica mediante IA.
     * 
     * @param vacanteId    ID de la vacante
     * @param reclutadorId ID del reclutador que solicita el ranking
     * @return ResponseEntity con la lista de resultados del ranking
     */
    @GetMapping("/ranking-candidatos/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> generarRankingCandidatos(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(integracionIAService.generarRankingCandidatos(vacanteId));
    }

    /**
     * Analiza la compatibilidad entre todos los candidatos postulados a una
     * vacante.
     * 
     * @param vacanteId    ID de la vacante
     * @param reclutadorId ID del reclutador que solicita el análisis
     * @return ResponseEntity con el mapa de análisis de candidatos
     */
    @GetMapping("/analisis-candidatos-vacante/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #reclutadorId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> analizarCandidatosPostulados(
            @PathVariable Long vacanteId,
            @RequestParam Long reclutadorId) {
        return ResponseEntity.ok(iaService.analizarCandidatosPostulados(vacanteId));
    }

    /**
     * Analiza la compatibilidad entre todos los candidatos postulados a una
     * vacante.
     * Endpoint alternativo para mantener compatibilidad con el frontend.
     * 
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el mapa de análisis de candidatos
     */
    @GetMapping("/analizar-candidatos-postulados/{vacanteId}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> analizarCandidatosPostuladosAlt(
            @PathVariable Long vacanteId) {
        log.info("Recibida solicitud para analizar candidatos postulados a vacante ID: {}", vacanteId);
        return ResponseEntity.ok(iaService.analizarCandidatosPostulados(vacanteId));
    }

    /**
     * Recomienda candidatos para una vacante (endpoint alternativo).
     * 
     * @param vacanteId ID de la vacante
     * @param limite    Número máximo de candidatos a recomendar
     * @return ResponseEntity con la lista de candidatos recomendados
     */
    @GetMapping("/recomendar-candidatos")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<List<CandidatoResponse>> recomendarCandidatosAlt(
            @RequestParam Long vacanteId,
            @RequestParam(defaultValue = "5") int limite) {
        log.info("Recibida solicitud para recomendar candidatos para vacante ID: {}, límite: {}", vacanteId, limite);
        return ResponseEntity.ok(iaService.recomendarCandidatos(vacanteId, limite));
    }

    /**
     * Obtiene todos los emparejamientos de un candidato con las vacantes
     * disponibles.
     * 
     * @param candidatoId ID del candidato
     * @param limite      Número máximo de vacantes a evaluar
     * @return ResponseEntity con la lista de emparejamientos calculados
     */
    @GetMapping("/emparejamientos-candidato/{candidatoId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<EmparejamientoResponse>> obtenerEmparejamientosCandidato(
            @PathVariable Long candidatoId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(iaService.calcularEmparejamientosCandidato(candidatoId, limite));
    }

    /**
     * Genera una pregunta con IA para pruebas técnicas según el tipo especificado.
     * 
     * @param tipoPregunta    Tipo de pregunta a generar (DESARROLLO,
     *                        OPCION_MULTIPLE, VERDADERO_FALSO, CODIGO, etc.)
     * @param nivelDificultad Nivel de dificultad de la pregunta (BASICO,
     *                        INTERMEDIO, AVANZADO)
     * @return ResponseEntity con un mapa que contiene la pregunta generada y
     *         posibles opciones/respuesta
     */
    @GetMapping("/generar-pregunta")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> generarPregunta(
            @RequestParam String tipoPregunta,
            @RequestParam(required = false) String nivelDificultad) {
        return ResponseEntity.ok(integracionIAService.generarPregunta(tipoPregunta, nivelDificultad));
    }
}