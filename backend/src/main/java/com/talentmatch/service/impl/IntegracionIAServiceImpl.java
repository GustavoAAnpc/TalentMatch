package com.talentmatch.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentmatch.config.GeminiConfig;
import com.talentmatch.exception.IAException;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.PruebaTecnica;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.PostulacionRepository;
import com.talentmatch.repository.PruebaTecnicaRepository;
import com.talentmatch.repository.VacanteRepository;
import com.talentmatch.service.IntegracionIAService;
import com.talentmatch.util.DocumentoUtil;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de integración con Gemini 1.5 Flash.
 */
@Service
@Slf4j
public class IntegracionIAServiceImpl implements IntegracionIAService {

    @Autowired
    private GeminiConfig geminiConfig;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private CandidatoRepository candidatoRepository;

    @Autowired
    private VacanteRepository vacanteRepository;

    @Autowired
    private PruebaTecnicaRepository pruebaTecnicaRepository;

    @Autowired
    private PostulacionRepository postulacionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Map<String, Object> analizarCurriculum(MultipartFile curriculum) {
        try {
            log.info("Iniciando análisis de curriculum, tipo: {}, tamaño: {} bytes",
                    curriculum.getContentType(), curriculum.getSize());

            // Extraer texto del curriculum usando la nueva utilidad
            String contenido = DocumentoUtil.extraerTexto(curriculum);

            if (contenido.trim().isEmpty()) {
                throw new IAException("Análisis de CV", "No se pudo extraer texto del documento");
            }

            log.debug("Texto extraído del CV, longitud: {} caracteres", contenido.length());

            // Preparar el prompt para Gemini
            String prompt = "Analiza detalladamente el siguiente currículum y extrae toda la información relevante." +
                    "Es CRUCIAL extraer correctamente los datos personales y profesionales del candidato.\n\n" +
                    "INSTRUCCIONES ESPECÍFICAS:\n" +
                    "1. Extrae todos los datos personales y profesionales que encuentres.\n" +
                    "2. Asegúrate de identificar correctamente el título profesional/cargo actual.\n" +
                    "3. Para la experiencia laboral, incluye siempre el cargo/puesto específico y la empresa.\n" +
                    "4. Para educación, incluye siempre el título/grado específico y la institución.\n" +
                    "5. Extrae nombres, apellidos, teléfono, ubicación.\n" +
                    "6. MUY IMPORTANTE: Extrae TODOS los enlaces a redes sociales y sitios web, especialmente LinkedIn y GitHub.\n\n"
                    +
                    "Devuelve SOLO la información en formato JSON estructurado con EXACTAMENTE estos campos:\n" +
                    "{\n" +
                    "  \"datosPersonales\": {\n" +
                    "    \"nombre\": \"\",\n" +
                    "    \"apellido\": \"\",\n" +
                    "    \"telefono\": \"\",\n" +
                    "    \"email\": \"\",\n" +
                    "    \"ubicacion\": \"\",\n" +
                    "    \"sitioWeb\": \"\",\n" +
                    "    \"linkedinUrl\": \"\",\n" +
                    "    \"githubUrl\": \"\"\n" +
                    "  },\n" +
                    "  \"educacion\": [\n" +
                    "    {\n" +
                    "      \"titulo\": \"TÍTULO/GRADO ESPECÍFICO\",\n" +
                    "      \"institucion\": \"NOMBRE DE LA INSTITUCIÓN\",\n" +
                    "      \"ubicacion\": \"\",\n" +
                    "      \"fechaInicio\": \"\",\n" +
                    "      \"fechaFin\": \"\",\n" +
                    "      \"descripcion\": \"\"\n" +
                    "    }\n" +
                    "  ],\n" +
                    "  \"experienciaLaboral\": [\n" +
                    "    {\n" +
                    "      \"puesto\": \"CARGO/PUESTO ESPECÍFICO\",\n" +
                    "      \"empresa\": \"NOMBRE DE LA EMPRESA\",\n" +
                    "      \"ubicacion\": \"\",\n" +
                    "      \"fechaInicio\": \"\",\n" +
                    "      \"fechaFin\": \"\",\n" +
                    "      \"descripcion\": \"\"\n" +
                    "    }\n" +
                    "  ],\n" +
                    "  \"habilidadesTecnicas\": [],\n" +
                    "  \"idiomas\": [],\n" +
                    "  \"certificaciones\": [],\n" +
                    "  \"anosExperiencia\": 0,\n" +
                    "  \"tituloProfesional\": \"TÍTULO PROFESIONAL ESPECÍFICO\",\n" +
                    "  \"resumenPerfil\": \"\"\n" +
                    "}\n\n" +
                    "Curriculum a analizar: " + contenido;

            String respuesta = enviarSolicitudGemini(prompt);
            Map<String, Object> analisis = extraerJSONDeRespuesta(respuesta);

            // Verificar si el análisis contiene datos significativos
            boolean analisisVacio = verificarAnalisisVacio(analisis);
            if (analisisVacio) {
                log.warn("Gemini devolvió un análisis vacío o incompleto");
                analisis.put("advertencia",
                        "El análisis automático no detectó información significativa en el documento");
            }

            // Guardar el resultado en log para diagnóstico
            log.info("Análisis de CV completado con éxito: {}", analisis);

            return analisis;
        } catch (Exception e) {
            log.error("Error al analizar currículum con Gemini: {}", e.getMessage(), e);
            // Proporcionar un objeto de análisis por defecto en caso de error
            Map<String, Object> analisisPorDefecto = new HashMap<>();
            analisisPorDefecto.put("educacion", new ArrayList<>());
            analisisPorDefecto.put("experienciaLaboral", new ArrayList<>());
            analisisPorDefecto.put("habilidadesTecnicas", new ArrayList<>());
            analisisPorDefecto.put("idiomas", new ArrayList<>());
            analisisPorDefecto.put("certificaciones", new ArrayList<>());
            analisisPorDefecto.put("anosExperiencia", 0);
            analisisPorDefecto.put("tituloProfesional", "");
            analisisPorDefecto.put("resumenPerfil", "Error al analizar el CV: " + e.getMessage());
            analisisPorDefecto.put("error", e.getMessage());
            analisisPorDefecto.put("causaError", e.getClass().getSimpleName());
            return analisisPorDefecto;
        }
    }

    @Override
    public Map<String, Object> evaluarCompatibilidad(Long candidatoId, Long vacanteId) {
        try {
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new IAException("Evaluación de compatibilidad", "Candidato no encontrado"));

            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(() -> new IAException("Evaluación de compatibilidad", "Vacante no encontrada"));

            // Extraer palabras clave más relevantes para la comparación
            List<String> habilidadesCandidato = extraerPalabrasClaveHabilidades(candidato.getHabilidadesPrincipales());
            List<String> habilidadesVacante = extraerPalabrasClaveHabilidades(vacante.getHabilidadesRequeridas());

            // Calcular coincidencia de habilidades con diferente método para mayor
            // variabilidad
            double porcentajeHabilidades = calcularPorcentajeHabilidades(habilidadesCandidato, habilidadesVacante);

            // Calcular coincidencia de experiencia con una fórmula más detallada
            int experienciaCandidato = candidato.getExperienciaAnios() != null ? candidato.getExperienciaAnios() : 0;
            int experienciaRequerida = vacante.getExperienciaMinima() != null ? vacante.getExperienciaMinima() : 0;

            // Si la experiencia del candidato supera ampliamente la requerida, dar bonus
            double porcentajeExperiencia = calcularPorcentajeExperiencia(experienciaCandidato, experienciaRequerida);

            // Calcular puntaje final (ponderado)
            // Añadimos un pequeño factor aleatorio para evitar siempre el mismo resultado
            double factorAleatorio = 0.95 + (Math.random() * 0.1); // Entre 0.95 y 1.05
            double puntajeFinal = ((porcentajeHabilidades * 0.7) + (porcentajeExperiencia * 0.3)) * factorAleatorio;
            // Truncar a dos decimales y luego redondear al entero más cercano
            puntajeFinal = Math.round(Math.min(100, puntajeFinal));
            int porcentajeFinal = (int) puntajeFinal;

            // Identificar fortalezas y debilidades de manera más detallada
            List<String> fortalezas = new ArrayList<>();
            List<String> debilidades = new ArrayList<>();
            List<String> recomendaciones = new ArrayList<>();

            // Evaluar fortalezas y debilidades en habilidades de manera más específica
            analizarHabilidades(habilidadesCandidato, habilidadesVacante, fortalezas, debilidades, recomendaciones);

            // Evaluar experiencia de manera más detallada
            analizarExperiencia(experienciaCandidato, experienciaRequerida, fortalezas, debilidades, recomendaciones);

            // Procesar con IA para análisis más detallado, pero sin sugerir un porcentaje
            // específico
            String prompt = "Evalúa la compatibilidad entre un candidato y una vacante de Vertex basado en esta información:\n\n"
                    +
                    "# INFORMACIÓN DEL CANDIDATO\n" +
                    "Nombre: " + candidato.getNombre() + " " + candidato.getApellido() + "\n" +
                    "Título profesional: " + candidato.getTituloProfesional() + "\n" +
                    "Resumen perfil: " + candidato.getResumenPerfil() + "\n" +
                    "Habilidades: " + candidato.getHabilidadesPrincipales() + "\n" +
                    "Años de experiencia: " + experienciaCandidato + "\n\n" +
                    "# INFORMACIÓN DE LA VACANTE EN VERTEX\n" +
                    "Título: " + vacante.getTitulo() + "\n" +
                    "Descripción: " + vacante.getDescripcion() + "\n" +
                    "Habilidades requeridas: " + vacante.getHabilidadesRequeridas() + "\n" +
                    "Experiencia mínima: " + experienciaRequerida + " años\n" +
                    "Ubicación: " + vacante.getUbicacion() + "\n" +
                    "Tipo de contrato: " + vacante.getTipoContrato() + "\n\n" +
                    "# INSTRUCCIONES PARA EL ANÁLISIS\n" +
                    "1. Realiza un análisis detallado comparando las habilidades del candidato con las requeridas por la vacante\n"
                    +
                    "2. Evalúa la experiencia profesional y formación respecto a los requisitos\n" +
                    "3. Identifica las fortalezas específicas del candidato para esta vacante\n" +
                    "4. Identifica las brechas o áreas de mejora del candidato respecto a los requisitos\n" +
                    "5. Proporciona recomendaciones concretas para que el candidato mejore su compatibilidad\n" +
                    "6. Calcula un porcentaje de compatibilidad entre 0 y 100 basado en todos los factores analizados\n"
                    +
                    "7. Genera mensajes personalizados tanto para el candidato como para el reclutador\n\n" +
                    "# FORMATO DE RESPUESTA\n" +
                    "Proporciona tu análisis completo en formato JSON con esta estructura exacta:\n" +
                    "{\n" +
                    "  \"porcentaje\": número entre 0 y 100,\n" +
                    "  \"fortalezas\": [\"fortaleza1\", \"fortaleza2\", ...],\n" +
                    "  \"debilidades\": [\"debilidad1\", \"debilidad2\", ...],\n" +
                    "  \"recomendaciones\": [\"recomendacion1\", \"recomendacion2\", ...],\n" +
                    "  \"mensajeCandidato\": \"Texto personalizado dirigido al candidato que explique la compatibilidad y ofrezca orientación profesional específica\",\n"
                    +
                    "  \"mensajeReclutador\": \"Texto dirigido al reclutador de Vertex con recomendaciones específicas sobre este candidato y su idoneidad\"\n"
                    +
                    "}";

            try {
                String respuesta = enviarSolicitudGemini(prompt);
                Map<String, Object> resultadoIA = extraerJSONDeRespuesta(respuesta);

                // Si la IA no devuelve un porcentaje o devuelve uno inválido, usar nuestro
                // cálculo local
                Integer porcentajeIA = null;
                if (resultadoIA.containsKey("porcentaje")) {
                    Object porcentajeObj = resultadoIA.get("porcentaje");
                    if (porcentajeObj instanceof Number) {
                        porcentajeIA = ((Number) porcentajeObj).intValue();
                    }
                }

                // Si la IA devuelve un porcentaje dentro de un rango razonable, usarlo
                if (porcentajeIA != null && porcentajeIA >= 0 && porcentajeIA <= 100) {
                    log.info("Usando porcentaje calculado por IA: {}", porcentajeIA);
                    resultadoIA.put("porcentaje", porcentajeIA);
                } else {
                    // De lo contrario, usar nuestro cálculo local
                    log.info("Usando porcentaje calculado localmente: {}", porcentajeFinal);
                    resultadoIA.put("porcentaje", porcentajeFinal);
                }

                // Asegurarse de que los mensajes para candidato y reclutador existan
                if (!resultadoIA.containsKey("mensajeCandidato") || resultadoIA.get("mensajeCandidato") == null) {
                    resultadoIA.put("mensajeCandidato",
                            generarMensajeCandidato(candidato, vacante, porcentajeFinal, fortalezas, debilidades));
                }

                if (!resultadoIA.containsKey("mensajeReclutador") || resultadoIA.get("mensajeReclutador") == null) {
                    resultadoIA.put("mensajeReclutador",
                            generarMensajeReclutador(candidato, vacante, porcentajeFinal, fortalezas, debilidades));
                }

                log.info("Análisis de compatibilidad completado por IA: {}", resultadoIA);
                return resultadoIA;
            } catch (Exception e) {
                log.warn("Error al procesar respuesta de IA, usando cálculo local: {}", e.getMessage());
                // Si falla la IA, utilizamos nuestro cálculo local
                Map<String, Object> resultado = new HashMap<>();
                resultado.put("porcentaje", porcentajeFinal);
                resultado.put("fortalezas", fortalezas);
                resultado.put("debilidades", debilidades);
                resultado.put("recomendaciones", recomendaciones);
                resultado.put("mensajeCandidato",
                        generarMensajeCandidato(candidato, vacante, porcentajeFinal, fortalezas, debilidades));
                resultado.put("mensajeReclutador",
                        generarMensajeReclutador(candidato, vacante, porcentajeFinal, fortalezas, debilidades));
                return resultado;
            }
        } catch (Exception e) {
            log.error("Error al evaluar compatibilidad: {}", e.getMessage(), e);
            Map<String, Object> resultadoError = new HashMap<>();
            resultadoError.put("porcentaje", 0);
            resultadoError.put("fortalezas", List.of());
            resultadoError.put("debilidades", List.of("Error al evaluar compatibilidad"));
            resultadoError.put("recomendaciones", List.of("Intente nuevamente más tarde"));
            resultadoError.put("mensajeCandidato",
                    "No he podido completar el análisis de compatibilidad entre tu perfil y esta vacante debido a un error técnico. Te recomiendo verificar que tu perfil tenga información completa y actualizada antes de intentar nuevamente.");
            resultadoError.put("mensajeReclutador",
                    "He encontrado un problema al analizar la compatibilidad de este candidato. Recomiendo revisar manualmente el perfil o ejecutar el análisis nuevamente cuando el sistema esté funcionando correctamente.");
            resultadoError.put("error", e.getMessage());
            return resultadoError;
        }
    }

    @Override
    public List<String> generarPreguntasPruebaTecnica(String tituloVacante, String descripcionVacante,
            String habilidadesRequeridas, int numPreguntas) {
        try {
            String prompt = "# GENERACIÓN DE PRUEBA TÉCNICA PARA VERTEX\n\n" +
                    "## DATOS DE LA VACANTE\n" +
                    "Título: " + tituloVacante + "\n" +
                    "Descripción: " + descripcionVacante + "\n" +
                    "Habilidades requeridas: " + habilidadesRequeridas + "\n\n" +
                    "## INSTRUCCIONES\n" +
                    "Genera exactamente " + numPreguntas
                    + " preguntas técnicas para evaluar a los candidatos para esta vacante en Vertex.\n\n" +
                    "Las preguntas deben cumplir los siguientes requisitos:\n" +
                    "1. Ser específicas y relevantes a las habilidades mencionadas\n" +
                    "2. Tener una dificultad apropiada para un puesto profesional\n" +
                    "3. Evaluar tanto conocimientos teóricos como capacidad de resolución de problemas\n" +
                    "4. Incluir escenarios prácticos relacionados con situaciones reales de trabajo en Vertex\n" +
                    "5. Evitar preguntas genéricas que no evalúen verdaderamente la capacidad técnica\n" +
                    "6. Cubrir diferentes aspectos de las habilidades mencionadas\n\n" +
                    "## FORMATO DE RESPUESTA\n" +
                    "Proporciona una lista numerada de exactamente " + numPreguntas
                    + " preguntas, una por línea, sin explicaciones adicionales.";

            String respuesta = enviarSolicitudGemini(prompt);
            return procesarRespuestaComoLista(respuesta);
        } catch (Exception e) {
            log.error("Error al generar preguntas con Gemini: {}", e.getMessage());
            throw new IAException("Generación de preguntas", e.getMessage());
        }
    }

    @Override
    public Map<String, Object> evaluarRespuestasPruebaTecnica(Long pruebaTecnicaId) {
        try {
            PruebaTecnica prueba = pruebaTecnicaRepository.findById(pruebaTecnicaId)
                    .orElseThrow(() -> new IAException("Evaluación de respuestas", "Prueba técnica no encontrada"));

            StringBuilder sb = new StringBuilder();
            sb.append("# EVALUACIÓN DE PRUEBA TÉCNICA PARA VERTEX\n\n");

            // Añadir contexto
            sb.append("## CONTEXTO\n")
                    .append("Vacante: ").append(prueba.getVacante().getTitulo()).append("\n")
                    .append("Habilidades requeridas: ").append(prueba.getVacante().getHabilidadesRequeridas())
                    .append("\n")
                    .append("Título de la prueba: ").append(prueba.getTitulo()).append("\n")
                    .append("Nivel de dificultad: ").append(prueba.getNivelDificultad()).append("\n\n");

            sb.append("## PREGUNTAS Y RESPUESTAS DEL CANDIDATO\n\n");

            // Construir pares de preguntas y respuestas para el prompt
            List<String> preguntasTexto = prueba.getPreguntasTexto();
            List<String> respuestasTexto = prueba.getRespuestas();

            for (int i = 0; i < preguntasTexto.size(); i++) {
                sb.append("### Pregunta ").append(i + 1).append(":\n")
                        .append(preguntasTexto.get(i)).append("\n\n");

                String respuesta = i < respuestasTexto.size() ? respuestasTexto.get(i) : "Sin respuesta";

                sb.append("### Respuesta ").append(i + 1).append(":\n")
                        .append(respuesta).append("\n\n");
            }

            sb.append("## INSTRUCCIONES DE EVALUACIÓN\n")
                    .append("1. Evalúa cada respuesta en una escala de 0 a 100 puntos\n")
                    .append("2. Considera la precisión técnica, completitud y claridad de cada respuesta\n")
                    .append("3. Proporciona retroalimentación constructiva y específica para cada respuesta\n")
                    .append("4. Calcula una puntuación total considerando todas las respuestas\n")
                    .append("5. La evaluación debe ser justa y basada estrictamente en el contenido técnico\n\n");

            sb.append("## FORMATO DE RESPUESTA\n")
                    .append("Proporciona tu evaluación en formato JSON con esta estructura exacta:\n")
                    .append("{\n")
                    .append("  \"puntuacionTotal\": número entre 0 y 100,\n")
                    .append("  \"evaluaciones\": [\n")
                    .append("    { \"pregunta\": 1, \"puntuacion\": número entre 0 y 100, \"retroalimentacion\": \"texto específico sobre esta respuesta\" },\n")
                    .append("    { \"pregunta\": 2, \"puntuacion\": número entre 0 y 100, \"retroalimentacion\": \"texto específico sobre esta respuesta\" },\n")
                    .append("    ...\n")
                    .append("  ],\n")
                    .append("  \"fortalezas\": [\"fortaleza1\", \"fortaleza2\", ...],\n")
                    .append("  \"areasAMejorar\": [\"area1\", \"area2\", ...],\n")
                    .append("  \"recomendacionGeneral\": \"texto con recomendación general para el candidato\"\n")
                    .append("}");

            String respuesta = enviarSolicitudGemini(sb.toString());
            return extraerJSONDeRespuesta(respuesta);
        } catch (Exception e) {
            log.error("Error al evaluar respuestas: {}", e.getMessage());
            throw new IAException("Evaluación de respuestas", e.getMessage());
        }
    }

    @Override
    public String generarRetroalimentacion(Long postulacionId) {
        try {
            Postulacion postulacion = postulacionRepository.findById(postulacionId)
                    .orElseThrow(() -> new IAException("Generación de retroalimentación", "Postulación no encontrada"));

            Candidato candidato = postulacion.getCandidato();
            Vacante vacante = postulacion.getVacante();

            String prompt = "Genera retroalimentación constructiva para un candidato que aplicó a una vacante.\n" +
                    "Datos del candidato: " + candidato.getNombre() + " " + candidato.getApellido() + "\n" +
                    "Perfil: " + candidato.getResumenPerfil() + "\n" +
                    "Habilidades: " + candidato.getHabilidadesPrincipales() + "\n\n" +
                    "Detalles de la vacante: " + vacante.getTitulo() + "\n" +
                    "Descripción: " + vacante.getDescripcion() + "\n" +
                    "Habilidades requeridas: " + vacante.getHabilidadesRequeridas() + "\n\n" +
                    "Estado de la postulación: " + postulacion.getEstado() + "\n\n" +
                    "La retroalimentación debe ser específica, útil, profesional y ayudar al candidato a mejorar. " +
                    "Incluye aspectos positivos y áreas de mejora. Enfócate en cómo podría aumentar sus posibilidades "
                    +
                    "en futuras oportunidades similares.";

            return enviarSolicitudGemini(prompt);
        } catch (Exception e) {
            log.error("Error al generar retroalimentación con Gemini: {}", e.getMessage());
            throw new IAException("Generación de retroalimentación", e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> generarRankingCandidatos(Long vacanteId) {
        try {
            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(() -> new IAException("Generación de ranking", "Vacante no encontrada"));

            // Obtener candidatos postulados o una muestra de candidatos si es necesario
            List<Candidato> candidatos = candidatoRepository.findTop10ByOrderByIdDesc();

            if (candidatos.isEmpty()) {
                return new ArrayList<>();
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Genera un ranking de compatibilidad entre la siguiente vacante y los candidatos listados:\n\n")
                    .append("VACANTE: ").append(vacante.getTitulo()).append("\n")
                    .append("Descripción: ").append(vacante.getDescripcion()).append("\n")
                    .append("Habilidades requeridas: ").append(vacante.getHabilidadesRequeridas()).append("\n")
                    .append("Experiencia mínima: ").append(vacante.getExperienciaMinima()).append(" años\n\n")
                    .append("CANDIDATOS:\n");

            for (int i = 0; i < candidatos.size(); i++) {
                Candidato candidato = candidatos.get(i);
                sb.append(i + 1).append(". ID: ").append(candidato.getId()).append(", ")
                        .append("Nombre: ").append(candidato.getNombre()).append(" ").append(candidato.getApellido())
                        .append(", ")
                        .append("Perfil: ").append(candidato.getResumenPerfil()).append(", ")
                        .append("Habilidades: ").append(candidato.getHabilidadesPrincipales()).append(", ")
                        .append("Experiencia: ").append(candidato.getExperienciaAnios()).append(" años\n");
            }

            sb.append("\nDevuelve un array en formato JSON con esta estructura exacta: ")
                    .append("[ { \"candidatoId\": 1, \"puntuacion\": 85, \"justificacion\": \"texto\" }, ")
                    .append("{ \"candidatoId\": 2, \"puntuacion\": 75, \"justificacion\": \"texto\" } ]");

            String respuesta = enviarSolicitudGemini(sb.toString());
            List<Map<String, Object>> ranking = extraerJSONArrayDeRespuesta(respuesta);

            // Asegurarse de que los IDs de candidato sean correctos (pueden estar en orden
            // diferente en la respuesta)
            for (Map<String, Object> resultado : ranking) {
                int candidatoIndex = ((Number) resultado.get("candidatoId")).intValue() - 1;
                if (candidatoIndex >= 0 && candidatoIndex < candidatos.size()) {
                    resultado.put("candidatoId", candidatos.get(candidatoIndex).getId());
                }
            }

            return ranking;
        } catch (Exception e) {
            log.error("Error al generar ranking con Gemini: {}", e.getMessage());
            throw new IAException("Generación de ranking", e.getMessage());
        }
    }

    @Override
    public List<String> sugerirMejorasPerfil(Long candidatoId) {
        try {
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new IAException("Sugerencias de mejora", "Candidato no encontrado"));

            String prompt = "Sugiere mejoras para el perfil profesional de un candidato en una plataforma de empleo:\n"
                    +
                    "Nombre: " + candidato.getNombre() + " " + candidato.getApellido() + "\n" +
                    "Título profesional: " + candidato.getTituloProfesional() + "\n" +
                    "Resumen del perfil: " + candidato.getResumenPerfil() + "\n" +
                    "Habilidades principales: " + candidato.getHabilidadesPrincipales() + "\n" +
                    "Años de experiencia: " + candidato.getExperienciaAnios() + "\n\n" +
                    "Proporciona 5 sugerencias específicas, prácticas y orientadas a aumentar su empleabilidad. " +
                    "Cada sugerencia debe ser concreta y accionable. " +
                    "Responde únicamente con una lista numerada de sugerencias, una por línea.";

            String respuesta = enviarSolicitudGemini(prompt);
            return procesarRespuestaComoLista(respuesta);
        } catch (Exception e) {
            log.error("Error al sugerir mejoras con Gemini: {}", e.getMessage());
            throw new IAException("Sugerencias de mejora", e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> sugerirVacantes(Long candidatoId) {
        try {
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new IAException("Sugerencias de vacantes", "Candidato no encontrado"));

            // Obtener una muestra de vacantes activas
            List<Vacante> vacantes = vacanteRepository.findTop10ByOrderByIdDesc();

            if (vacantes.isEmpty()) {
                return new ArrayList<>();
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Recomienda vacantes adecuadas para este candidato basado en su perfil:\n\n")
                    .append("CANDIDATO:\n")
                    .append("Nombre: ").append(candidato.getNombre()).append(" ").append(candidato.getApellido())
                    .append("\n")
                    .append("Título profesional: ").append(candidato.getTituloProfesional()).append("\n")
                    .append("Resumen del perfil: ").append(candidato.getResumenPerfil()).append("\n")
                    .append("Habilidades principales: ").append(candidato.getHabilidadesPrincipales()).append("\n")
                    .append("Años de experiencia: ").append(candidato.getExperienciaAnios()).append("\n\n")
                    .append("VACANTES DISPONIBLES:\n");

            for (int i = 0; i < vacantes.size(); i++) {
                Vacante vacante = vacantes.get(i);
                sb.append(i + 1).append(". ID: ").append(vacante.getId()).append(", ")
                        .append("Título: ").append(vacante.getTitulo()).append(", ")
                        .append("Descripción: ").append(vacante.getDescripcion()).append(", ")
                        .append("Habilidades requeridas: ").append(vacante.getHabilidadesRequeridas()).append(", ")
                        .append("Experiencia mínima: ").append(vacante.getExperienciaMinima()).append(" años\n");
            }

            sb.append("\nDevuelve un array en formato JSON con esta estructura exacta: ")
                    .append("[ { \"vacanteId\": 1, \"compatibilidad\": 90 }, ")
                    .append("{ \"vacanteId\": 2, \"compatibilidad\": 85 } ]");

            String respuesta = enviarSolicitudGemini(sb.toString());
            List<Map<String, Object>> sugerencias = extraerJSONArrayDeRespuesta(respuesta);

            // Asegurarse de que los IDs de vacante sean correctos (pueden estar en orden
            // diferente en la respuesta)
            for (Map<String, Object> sugerencia : sugerencias) {
                int vacanteIndex = ((Number) sugerencia.get("vacanteId")).intValue() - 1;
                if (vacanteIndex >= 0 && vacanteIndex < vacantes.size()) {
                    sugerencia.put("vacanteId", vacantes.get(vacanteIndex).getId());
                }
            }

            return sugerencias;
        } catch (Exception e) {
            log.error("Error al sugerir vacantes con Gemini: {}", e.getMessage());
            throw new IAException("Sugerencias de vacantes", e.getMessage());
        }
    }

    /**
     * Envía una solicitud a la API de Gemini 1.5 Flash.
     * 
     * @param prompt Texto de entrada para Gemini
     * @return Respuesta generada por Gemini
     * @throws JsonProcessingException Si hay un error al procesar el JSON
     */
    @Override
    public String enviarSolicitudGemini(String prompt) throws JsonProcessingException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();

        parts.put("text", prompt);

        List<Map<String, Object>> partsList = new ArrayList<>();
        partsList.add(parts);

        contents.put("parts", partsList);

        List<Map<String, Object>> contentsList = new ArrayList<>();
        contentsList.add(contents);

        requestBody.put("contents", contentsList);

        // Configurar parámetros de generación para obtener respuestas más variadas
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7); // Aumentado para más variabilidad
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.9); // Aumentado ligeramente
        requestBody.put("generationConfig", generationConfig);

        String url = geminiConfig.getApiUrl() + "?key=" + geminiConfig.getApiKey();

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Enviando solicitud a Gemini API: {}", url);
            String response = restTemplate.postForObject(url, entity, String.class);
            log.debug("Respuesta recibida de Gemini API");
            return extraerTextoDeRespuesta(response);
        } catch (Exception e) {
            log.error("Error al comunicarse con la API de Gemini: {}", e.getMessage());
            throw new IAException("API de Gemini", e.getMessage());
        }
    }

    /**
     * Extrae el texto de la respuesta JSON de Gemini.
     * 
     * @param jsonResponse Respuesta JSON de Gemini
     * @return Texto extraído de la respuesta
     * @throws JsonProcessingException Si hay un error al procesar el JSON
     */
    private String extraerTextoDeRespuesta(String jsonResponse) throws JsonProcessingException {
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResponse);

            // Verificar si hay un error en la respuesta
            if (rootNode.has("error")) {
                JsonNode error = rootNode.get("error");
                String errorMessage = error.has("message") ? error.get("message").asText()
                        : "Error desconocido de la API";
                log.error("Error en la respuesta de Gemini: {}", errorMessage);
                throw new IAException("API de Gemini", errorMessage);
            }

            JsonNode candidates = rootNode.path("candidates");

            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");

                if (parts.isArray() && parts.size() > 0) {
                    String texto = parts.get(0).path("text").asText();
                    if (texto != null && !texto.trim().isEmpty()) {
                        return texto;
                    }
                }
            }

            log.error("No se pudo extraer texto de la respuesta: {}", jsonResponse);
            throw new IAException("Procesamiento de respuesta", "No se pudo extraer texto de la respuesta de Gemini");
        } catch (JsonProcessingException e) {
            log.error("Error al procesar JSON de respuesta: {}", e.getMessage());
            throw new IAException("Procesamiento de respuesta",
                    "Error al procesar la respuesta de Gemini: " + e.getMessage());
        }
    }

    /**
     * Extrae un objeto JSON de la respuesta de texto de Gemini.
     * 
     * @param respuesta Respuesta de Gemini
     * @return Mapa con la información extraída
     */
    private Map<String, Object> extraerJSONDeRespuesta(String respuesta) {
        if (respuesta == null || respuesta.trim().isEmpty()) {
            log.warn("La respuesta de Gemini está vacía");
            return new HashMap<>();
        }

        try {
            // Intentar primero interpretar toda la respuesta como JSON
            try {
                return objectMapper.readValue(respuesta, new TypeReference<Map<String, Object>>() {
                });
            } catch (Exception e) {
                log.debug("La respuesta completa no es un JSON válido, intentando extraer JSON de la respuesta");
            }

            // Buscar patrones de JSON en la respuesta
            Pattern pattern = Pattern.compile("\\{[^{}]*(?:\\{[^{}]*}[^{}]*)*}");
            Matcher matcher = pattern.matcher(respuesta);

            while (matcher.find()) {
                String jsonStr = matcher.group();
                try {
                    Map<String, Object> result = objectMapper.readValue(jsonStr,
                            new TypeReference<Map<String, Object>>() {
                            });
                    if (!result.isEmpty()) {
                        log.debug("JSON extraído correctamente de la respuesta");
                        return result;
                    }
                } catch (Exception e) {
                    log.debug("Fragmento no es un JSON válido, continuando búsqueda: {}",
                            jsonStr.substring(0, Math.min(50, jsonStr.length())));
                }
            }

            // Si no se encontró un JSON válido, revisar si hay una estructura clave-valor
            // simple
            Map<String, Object> resultado = new HashMap<>();
            Pattern keyValuePattern = Pattern
                    .compile("\"([^\"]+)\"\\s*:\\s*(\"[^\"]*\"|\\[[^\\]]*\\]|\\d+|\\{[^\\}]*\\}|true|false|null)");
            Matcher keyValueMatcher = keyValuePattern.matcher(respuesta);

            while (keyValueMatcher.find()) {
                String key = keyValueMatcher.group(1);
                String valueStr = keyValueMatcher.group(2);

                try {
                    // Intentar analizar el valor según su formato
                    Object value;
                    if (valueStr.startsWith("\"") && valueStr.endsWith("\"")) {
                        value = valueStr.substring(1, valueStr.length() - 1);
                    } else if (valueStr.equals("true")) {
                        value = Boolean.TRUE;
                    } else if (valueStr.equals("false")) {
                        value = Boolean.FALSE;
                    } else if (valueStr.equals("null")) {
                        value = null;
                    } else if (valueStr.startsWith("[")) {
                        value = new ArrayList<>(); // Lista vacía como fallback
                    } else {
                        try {
                            value = Integer.parseInt(valueStr);
                        } catch (NumberFormatException e1) {
                            try {
                                value = Double.parseDouble(valueStr);
                            } catch (NumberFormatException e2) {
                                value = valueStr;
                            }
                        }
                    }

                    resultado.put(key, value);
                } catch (Exception e) {
                    log.debug("No se pudo procesar el par clave-valor: {}:{}", key, valueStr);
                }
            }

            if (!resultado.isEmpty()) {
                log.debug("Se extrajeron {} pares clave-valor de la respuesta", resultado.size());
                return resultado;
            }

            // Si nada más funciona, crear un mapa con la respuesta completa
            log.warn("No se pudo extraer un JSON válido de la respuesta");
            resultado.put("respuestaCompleta", respuesta);
            return resultado;
        } catch (Exception e) {
            log.error("Error al extraer JSON de la respuesta: {}", e.getMessage());

            // Si falla, devolver un mapa con la respuesta completa
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("respuestaCompleta", respuesta);
            resultado.put("error", "Error al procesar respuesta: " + e.getMessage());
            return resultado;
        }
    }

    /**
     * Extrae un array JSON de la respuesta de texto de Gemini.
     * 
     * @param respuesta Respuesta de Gemini
     * @return Lista de mapas con la información extraída
     */
    private List<Map<String, Object>> extraerJSONArrayDeRespuesta(String respuesta) {
        try {
            // Buscar patrones de array JSON en la respuesta
            Pattern pattern = Pattern.compile("\\[[^\\[\\]]*(?:\\{[^{}]*}[^\\[\\]]*)*]");
            Matcher matcher = pattern.matcher(respuesta);

            if (matcher.find()) {
                String jsonStr = matcher.group();
                return objectMapper.readValue(jsonStr, new TypeReference<List<Map<String, Object>>>() {
                });
            }

            // Si no se encuentra un patrón de array, intentar parsear toda la respuesta
            return objectMapper.readValue(respuesta, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception e) {
            log.error("Error al extraer array JSON de la respuesta: {}", e.getMessage());

            // Si falla, devolver una lista vacía
            return new ArrayList<>();
        }
    }

    /**
     * Procesa la respuesta de Gemini como una lista.
     * 
     * @param respuesta Respuesta de Gemini
     * @return Lista con la información procesada
     */
    private List<String> procesarRespuestaComoLista(String respuesta) {
        List<String> resultado = new ArrayList<>();

        // Buscar elementos numerados (1. Item, 2. Item, etc.)
        Pattern pattern = Pattern.compile("\\d+\\.\\s*(.+)");
        Matcher matcher = pattern.matcher(respuesta);

        while (matcher.find()) {
            resultado.add(matcher.group(1).trim());
        }

        // Si no se encontraron elementos numerados, dividir por líneas
        if (resultado.isEmpty()) {
            String[] lineas = respuesta.split("\\r?\\n");
            for (String linea : lineas) {
                linea = linea.trim();
                if (!linea.isEmpty()) {
                    resultado.add(linea);
                }
            }
        }

        return resultado;
    }

    /**
     * Extrae palabras clave de un texto de habilidades.
     * 
     * @param textoHabilidades Texto con habilidades
     * @return Lista de habilidades como palabras clave
     */
    private List<String> extraerPalabrasClaveHabilidades(String textoHabilidades) {
        if (textoHabilidades == null || textoHabilidades.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Dividir por comas, punto y coma, o saltos de línea
        String[] habilidadesCrudas = textoHabilidades.split("[,;\\n]");
        List<String> habilidadesLimpio = new ArrayList<>();

        for (String habilidad : habilidadesCrudas) {
            habilidad = habilidad.trim().toLowerCase();
            if (!habilidad.isEmpty()) {
                habilidadesLimpio.add(habilidad);
            }
        }

        return habilidadesLimpio;
    }

    /**
     * Cuenta coincidencias entre dos listas de strings.
     * 
     * @param lista1 Primera lista
     * @param lista2 Segunda lista
     * @return Número de coincidencias
     */
    private int contarCoincidencias(List<String> lista1, List<String> lista2) {
        int coincidencias = 0;
        for (String item1 : lista1) {
            for (String item2 : lista2) {
                // Verificar si el item1 contiene o está contenido en item2
                if (item1.contains(item2) || item2.contains(item1)) {
                    coincidencias++;
                    break;
                }
            }
        }
        return coincidencias;
    }

    /**
     * Verifica si el análisis contiene datos significativos.
     *
     * @param analisis Mapa con el análisis del CV
     * @return true si el análisis está vacío o no contiene datos significativos
     */
    private boolean verificarAnalisisVacio(Map<String, Object> analisis) {
        if (analisis == null || analisis.isEmpty()) {
            return true;
        }

        // Verificar campos principales
        boolean camposListaVacios = true;

        if (analisis.containsKey("educacion") && analisis.get("educacion") instanceof List<?>) {
            camposListaVacios = camposListaVacios && ((List<?>) analisis.get("educacion")).isEmpty();
        }

        if (analisis.containsKey("experienciaLaboral") && analisis.get("experienciaLaboral") instanceof List<?>) {
            camposListaVacios = camposListaVacios && ((List<?>) analisis.get("experienciaLaboral")).isEmpty();
        }

        if (analisis.containsKey("habilidadesTecnicas") && analisis.get("habilidadesTecnicas") instanceof List<?>) {
            camposListaVacios = camposListaVacios && ((List<?>) analisis.get("habilidadesTecnicas")).isEmpty();
        }

        // Verificar campos de texto
        boolean camposTextoVacios = true;

        if (analisis.containsKey("tituloProfesional") && analisis.get("tituloProfesional") instanceof String) {
            camposTextoVacios = camposTextoVacios && ((String) analisis.get("tituloProfesional")).trim().isEmpty();
        }

        if (analisis.containsKey("resumenPerfil") && analisis.get("resumenPerfil") instanceof String) {
            camposTextoVacios = camposTextoVacios && ((String) analisis.get("resumenPerfil")).trim().isEmpty();
        }

        return camposListaVacios && camposTextoVacios;
    }

    private double calcularPorcentajeHabilidades(List<String> habilidadesCandidato, List<String> habilidadesVacante) {
        if (habilidadesVacante.isEmpty()) {
            return 0;
        }

        // Contar coincidencias
        int coincidencias = contarCoincidencias(habilidadesCandidato, habilidadesVacante);

        // Calcular porcentaje básico
        double porcentajeBase = (double) coincidencias / habilidadesVacante.size() * 100;

        // Añadir bonus por alta tasa de coincidencia
        double porcentajeFinal = porcentajeBase;
        if (coincidencias > 0 && habilidadesCandidato.size() > 0) {
            // Si el candidato tiene más habilidades que las requeridas, dar un pequeño
            // bonus
            double ratioHabilidades = (double) habilidadesCandidato.size() / habilidadesVacante.size();
            if (ratioHabilidades > 1.5) {
                porcentajeFinal += 5; // Bonus de 5% por tener muchas más habilidades
            }

            // Si tiene una coincidencia muy alta, dar otro bonus
            double tasaCoincidencia = (double) coincidencias / habilidadesVacante.size();
            if (tasaCoincidencia > 0.8) {
                porcentajeFinal += 10; // Bonus de 10% por alta coincidencia
            }
        }

        return Math.min(100, porcentajeFinal);
    }

    private double calcularPorcentajeExperiencia(int experienciaCandidato, int experienciaRequerida) {
        if (experienciaRequerida == 0) {
            return 100; // Si no se requiere experiencia, 100% de coincidencia
        }

        double porcentajeBase = Math.min(100, (double) experienciaCandidato / experienciaRequerida * 100);

        // Bonus por exceder significativamente la experiencia requerida
        if (experienciaCandidato > experienciaRequerida) {
            double excedente = experienciaCandidato - experienciaRequerida;
            // El bonus es mayor si la experiencia requerida es baja
            double factorBonus = experienciaRequerida <= 2 ? 5.0 : 2.5;
            double bonus = Math.min(15, excedente * factorBonus); // Máximo 15% de bonus
            porcentajeBase += bonus;
        }

        return Math.min(100, porcentajeBase);
    }

    private void analizarHabilidades(List<String> habilidadesCandidato, List<String> habilidadesVacante,
            List<String> fortalezas, List<String> debilidades, List<String> recomendaciones) {

        // Contar habilidades que coinciden para mensajes específicos
        int coincidencias = 0;
        List<String> habilidadesFaltantes = new ArrayList<>();

        for (String habilidad : habilidadesVacante) {
            boolean encontrada = false;
            for (String habilidadCandidato : habilidadesCandidato) {
                if (habilidadCandidato.contains(habilidad.toLowerCase()) ||
                        habilidad.toLowerCase().contains(habilidadCandidato)) {
                    encontrada = true;
                    break;
                }
            }

            if (encontrada) {
                coincidencias++;
                fortalezas.add("Posee la habilidad requerida: " + habilidad);
            } else {
                habilidadesFaltantes.add(habilidad);
                debilidades.add("No se encontró la habilidad: " + habilidad);
                recomendaciones.add("Adquirir conocimientos en: " + habilidad);
            }
        }

        // Añadir mensajes resumen según la proporción de coincidencias
        double proporcionCoincidencias = habilidadesVacante.isEmpty() ? 0
                : (double) coincidencias / habilidadesVacante.size();

        if (proporcionCoincidencias >= 0.8) {
            fortalezas.add("Excelente coincidencia con las habilidades requeridas para el puesto");
        } else if (proporcionCoincidencias >= 0.6) {
            fortalezas.add("Buena coincidencia con la mayoría de las habilidades requeridas");
        } else if (proporcionCoincidencias >= 0.4) {
            fortalezas.add("Coincidencia moderada con las habilidades requeridas");
        } else if (proporcionCoincidencias > 0) {
            debilidades.add("Baja coincidencia con las habilidades requeridas");
        } else {
            debilidades.add("No se encontraron coincidencias con las habilidades requeridas");
        }
    }

    private void analizarExperiencia(int experienciaCandidato, int experienciaRequerida,
            List<String> fortalezas, List<String> debilidades, List<String> recomendaciones) {

        if (experienciaRequerida == 0) {
            fortalezas.add("No se requiere experiencia previa para este puesto");
            return;
        }

        if (experienciaCandidato >= experienciaRequerida * 2) {
            fortalezas.add("Experiencia significativamente superior a la requerida (" +
                    experienciaCandidato + " años vs. " + experienciaRequerida + " años solicitados)");
        } else if (experienciaCandidato >= experienciaRequerida) {
            fortalezas.add("Cumple con la experiencia mínima requerida de " + experienciaRequerida + " años");
        } else if (experienciaCandidato >= experienciaRequerida * 0.7) {
            fortalezas.add("Experiencia cercana a la requerida");
            debilidades.add("Experiencia ligeramente por debajo de lo requerido: " + experienciaCandidato +
                    " años vs. " + experienciaRequerida + " años solicitados");
            recomendaciones.add("Destacar proyectos relevantes que compensen la diferencia de experiencia");
        } else {
            debilidades.add("Experiencia insuficiente: " + experienciaCandidato + " años vs. " +
                    experienciaRequerida + " años requeridos");
            int añosFaltantes = experienciaRequerida - experienciaCandidato;
            recomendaciones.add("Obtener " + añosFaltantes +
                    (añosFaltantes == 1 ? " año más de experiencia" : " años más de experiencia") +
                    " en el área o destacar formación complementaria");
        }
    }

    /**
     * Genera un mensaje personalizado para el candidato basado en el resultado del
     * análisis.
     * 
     * @param candidato   El candidato evaluado
     * @param vacante     La vacante analizada
     * @param porcentaje  El porcentaje de compatibilidad
     * @param fortalezas  Las fortalezas identificadas
     * @param debilidades Las debilidades identificadas
     * @return Mensaje personalizado para el candidato
     */
    private String generarMensajeCandidato(Candidato candidato, Vacante vacante, int porcentaje,
            List<String> fortalezas, List<String> debilidades) {

        StringBuilder mensaje = new StringBuilder();

        // Mensaje directo basado en el nivel de compatibilidad
        if (porcentaje >= 85) {
            mensaje.append("He analizado tu perfil y tienes una compatibilidad excepcional (").append(porcentaje)
                    .append("%) con la vacante de ")
                    .append(vacante.getTitulo())
                    .append(". Tu experiencia y habilidades se alinean perfectamente con lo que Vertex busca.");
        } else if (porcentaje >= 70) {
            mensaje.append("Basado en tu perfil, he detectado una buena compatibilidad (").append(porcentaje)
                    .append("%) con la vacante de ")
                    .append(vacante.getTitulo())
                    .append(". Cumples con la mayoría de requisitos que Vertex valora para esta posición.");
        } else if (porcentaje >= 50) {
            mensaje.append("He evaluado tu perfil y encontré una compatibilidad moderada (").append(porcentaje)
                    .append("%) con la vacante de ")
                    .append(vacante.getTitulo())
                    .append(". Aunque tienes potencial, existen áreas específicas que podrías mejorar.");
        } else {
            mensaje.append("Mi análisis indica una compatibilidad limitada (").append(porcentaje)
                    .append("%) entre tu perfil y la vacante de ")
                    .append(vacante.getTitulo())
                    .append(". Existe una brecha significativa entre tus cualificaciones actuales y los requisitos solicitados por Vertex.");
        }

        // Destacar principales fortalezas
        if (!fortalezas.isEmpty()) {
            mensaje.append("\n\nFORTALEZAS IDENTIFICADAS:");
            for (int i = 0; i < Math.min(3, fortalezas.size()); i++) {
                mensaje.append("\n• ").append(fortalezas.get(i));
            }
        }

        // Mencionar áreas de mejora
        if (!debilidades.isEmpty()) {
            mensaje.append("\n\nÁREAS DE MEJORA:");
            for (int i = 0; i < Math.min(3, debilidades.size()); i++) {
                mensaje.append("\n• ").append(debilidades.get(i));
            }
        }

        // Agregar conclusión relevante según el nivel de compatibilidad
        mensaje.append("\n\n");
        if (porcentaje >= 70) {
            mensaje.append(
                    "RECOMENDACIÓN: Postula a esta vacante. Tu perfil técnico tiene alta probabilidad de avanzar en el proceso de selección de Vertex.");
        } else if (porcentaje >= 50) {
            mensaje.append(
                    "RECOMENDACIÓN: Si decides postular, enfatiza tus fortalezas y experiencias relevantes para mejorar tus posibilidades de selección en Vertex.");
        } else {
            mensaje.append(
                    "RECOMENDACIÓN: Antes de postular a esta vacante en Vertex, considera desarrollar las habilidades mencionadas o destacar mejor tu experiencia relacionada.");
        }

        return mensaje.toString();
    }

    /**
     * Genera un mensaje personalizado para el reclutador basado en el resultado del
     * análisis.
     * 
     * @param candidato   El candidato evaluado
     * @param vacante     La vacante analizada
     * @param porcentaje  El porcentaje de compatibilidad
     * @param fortalezas  Las fortalezas identificadas
     * @param debilidades Las debilidades identificadas
     * @return Mensaje personalizado para el reclutador
     */
    private String generarMensajeReclutador(Candidato candidato, Vacante vacante, int porcentaje,
            List<String> fortalezas, List<String> debilidades) {

        StringBuilder mensaje = new StringBuilder();

        // Mensaje directo sobre la compatibilidad
        if (porcentaje >= 85) {
            mensaje.append("He analizado al candidato ").append(candidato.getNombre()).append(" ")
                    .append(candidato.getApellido()).append(" y detecté una compatibilidad excepcional (")
                    .append(porcentaje)
                    .append("%) con la vacante de ").append(vacante.getTitulo())
                    .append(". Recomiendo priorizar a este candidato en el proceso de selección.");
        } else if (porcentaje >= 70) {
            mensaje.append("Mi análisis del candidato ").append(candidato.getNombre()).append(" ")
                    .append(candidato.getApellido()).append(" indica una buena compatibilidad (").append(porcentaje)
                    .append("%) con la vacante de ").append(vacante.getTitulo())
                    .append(". Cumple con los requisitos principales que Vertex solicita.");
        } else if (porcentaje >= 50) {
            mensaje.append("He evaluado al candidato ").append(candidato.getNombre()).append(" ")
                    .append(candidato.getApellido()).append(" y encontré una compatibilidad moderada (")
                    .append(porcentaje)
                    .append("%) con la vacante de ").append(vacante.getTitulo())
                    .append(". Tiene potencial pero requeriría capacitación adicional.");
        } else {
            mensaje.append("Basado en mi análisis, el candidato ").append(candidato.getNombre()).append(" ")
                    .append(candidato.getApellido()).append(" muestra una compatibilidad limitada (").append(porcentaje)
                    .append("%) con la vacante de ").append(vacante.getTitulo())
                    .append(". Existen brechas significativas entre su perfil y los requisitos de Vertex.");
        }

        // Resumen de puntos fuertes
        if (!fortalezas.isEmpty()) {
            mensaje.append("\n\nPUNTOS FUERTES:");
            for (int i = 0; i < Math.min(3, fortalezas.size()); i++) {
                mensaje.append("\n• ").append(fortalezas.get(i));
            }
        }

        // Resumen de debilidades
        if (!debilidades.isEmpty()) {
            mensaje.append("\n\nPUNTOS A EVALUAR:");
            for (int i = 0; i < Math.min(3, debilidades.size()); i++) {
                mensaje.append("\n• ").append(debilidades.get(i));
            }
        }

        return mensaje.toString();
    }

    @Override
    public Map<String, String> generarDescripcionYTecnologias(Long vacanteId) {
        try {
            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(
                            () -> new IAException("Generación de descripción y tecnologías", "Vacante no encontrada"));

            String prompt = "# GENERACIÓN DE DESCRIPCIÓN Y TECNOLOGÍAS PARA PRUEBA TÉCNICA\n\n" +
                    "## DATOS DE LA VACANTE\n" +
                    "Título: " + vacante.getTitulo() + "\n" +
                    "Descripción: " + vacante.getDescripcion() + "\n" +
                    "Habilidades requeridas: " + vacante.getHabilidadesRequeridas() + "\n\n" +
                    "## INSTRUCCIONES\n" +
                    "Basándote en la información de la vacante proporcionada, genera lo siguiente:\n\n" +
                    "1. Una descripción profesional y concisa para una prueba técnica que evalúe las habilidades necesarias para este puesto.\n"
                    +
                    "2. Una lista refinada y específica de MÁXIMO 10 tecnologías y habilidades técnicas más relevantes a evaluar, basadas en las habilidades requeridas por la vacante.\n\n"
                    +
                    "## RESTRICCIONES IMPORTANTES\n" +
                    "- NO menciones ni hagas referencia al nivel de dificultad de la prueba (básico, intermedio, avanzado, etc.)\n"
                    +
                    "- NO menciones ni hagas referencia al tiempo o duración de la prueba\n" +
                    "- Mantén la descripción enfocada en el propósito y las habilidades a evaluar\n" +
                    "- Evita frases genéricas como \"esta prueba evaluará sus conocimientos\"\n\n" +
                    "## FORMATO DE RESPUESTA\n" +
                    "Proporciona tu respuesta en formato JSON con esta estructura exacta:\n" +
                    "{\n" +
                    "  \"descripcion\": \"Texto de la descripción detallada...\",\n" +
                    "  \"tecnologias\": \"Tecnología1, Tecnología2, Tecnología3, ...\"\n" +
                    "}\n\n" +
                    "IMPORTANTE: \n" +
                    "- Asegúrate de que la respuesta sea un JSON válido, utilizando comillas dobles para los nombres de los campos y valores.\n"
                    +
                    "- Incluye SOLAMENTE las tecnologías y habilidades más relevantes, con un MÁXIMO de 10 en total.";

            String respuesta = enviarSolicitudGemini(prompt);
            log.debug("Respuesta recibida de Gemini: {}", respuesta);

            Map<String, String> resultado = procesarRespuestaIA(respuesta);

            // Procesar la descripción para eliminar cualquier mención a dificultad o tiempo
            if (resultado.containsKey("descripcion")) {
                String descripcion = resultado.get("descripcion");
                descripcion = limpiarDescripcion(descripcion);
                resultado.put("descripcion", descripcion);
            }

            return resultado;
        } catch (Exception e) {
            log.error("Error al generar descripción y tecnologías con IA: {}", e.getMessage());

            // Proporcionar respuesta predeterminada en caso de error
            Map<String, String> respuestaPredeterminada = new HashMap<>();
            respuestaPredeterminada.put("descripcion",
                    "Esta prueba técnica evaluará sus conocimientos y habilidades específicas para el puesto. " +
                            "Demuestre su experiencia y conocimientos respondiendo a los desafíos planteados.");
            respuestaPredeterminada.put("tecnologias", "Programación, Desarrollo de software");

            return respuestaPredeterminada;
        }
    }

    @Override
    public Map<String, String> generarDescripcionYTecnologiasPorTitulo(String tituloPrueba) {
        try {
            log.info("Generando descripción y tecnologías para prueba técnica con título: {}", tituloPrueba);

            String prompt = "Genera una descripción técnica detallada y una lista de tecnologías relevantes para una prueba técnica "
                    +
                    "con el siguiente título: \"" + tituloPrueba + "\". " +
                    "La descripción debe ser profesional, clara y enfocada en evaluar habilidades técnicas. " +
                    "La lista de tecnologías debe incluir herramientas, lenguajes y frameworks relevantes para el título. "
                    +
                    "Formato requerido (JSON):\n" +
                    "{\n" +
                    "  \"descripcion\": \"Descripción detallada de la prueba técnica\",\n" +
                    "  \"tecnologias\": \"Tecnología1, Tecnología2, Tecnología3, ...\"\n" +
                    "}";

            String respuesta = enviarSolicitudGemini(prompt);
            return procesarRespuestaIA(respuesta);

        } catch (Exception e) {
            log.error("Error al generar descripción y tecnologías por título: {}", e.getMessage(), e);
            Map<String, String> resultadoError = new HashMap<>();
            resultadoError.put("descripcion", "Error al generar descripción: " + e.getMessage());
            resultadoError.put("tecnologias", "");
            return resultadoError;
        }
    }

    /**
     * Procesa la respuesta de la IA, extrayendo la descripción y tecnologías
     * 
     * @param respuesta La respuesta de texto de la IA
     * @return Mapa con la descripción y tecnologías extraídas
     */
    private Map<String, String> procesarRespuestaIA(String respuesta) {
        Map<String, String> resultado = new HashMap<>();

        try {
            // Intentar procesar como JSON directamente
            resultado = objectMapper.readValue(respuesta, new TypeReference<Map<String, String>>() {
            });
        } catch (Exception e) {
            log.debug("No se pudo procesar la respuesta como JSON directo: {}", e.getMessage());

            try {
                // Intentar extraer el JSON de la respuesta
                Map<String, Object> jsonExtraido = extraerJSONDeRespuesta(respuesta);

                // Convertir los valores a String
                if (jsonExtraido.containsKey("descripcion")) {
                    resultado.put("descripcion", jsonExtraido.get("descripcion").toString());
                }

                if (jsonExtraido.containsKey("tecnologias")) {
                    resultado.put("tecnologias", jsonExtraido.get("tecnologias").toString());
                }
            } catch (Exception ex) {
                log.error("Error al extraer JSON de la respuesta: {}", ex.getMessage());
                // Intentar extraer de forma manual
                resultado = extraerManualmente(respuesta);
            }
        }

        // Verificar que ambos campos existan, si no, extraer manualmente
        if (!resultado.containsKey("descripcion") || !resultado.containsKey("tecnologias")) {
            log.debug("No se encontraron los campos esperados, intentando extracción manual");
            resultado = extraerManualmente(respuesta);
        }

        // Limitar a máximo 10 tecnologías si hay más
        if (resultado.containsKey("tecnologias")) {
            String tecnologias = resultado.get("tecnologias");
            String[] tecnologiasArray = tecnologias.split(",");

            if (tecnologiasArray.length > 10) {
                String[] tecnologiasLimitadas = Arrays.copyOf(tecnologiasArray, 10);
                resultado.put("tecnologias", String.join(", ", tecnologiasLimitadas));
                log.debug("Tecnologías limitadas a 10: {}", resultado.get("tecnologias"));
            }
        }

        return resultado;
    }

    /**
     * Limpia la descripción generada para eliminar referencias a dificultad o
     * tiempo
     * 
     * @param descripcion La descripción original
     * @return La descripción limpia
     */
    private String limpiarDescripcion(String descripcion) {
        if (descripcion == null || descripcion.trim().isEmpty()) {
            return descripcion;
        }

        // Palabras y frases a eliminar relacionadas con dificultad
        String[] patronesDificultad = {
                "(?i)\\b(nivel|prueba) (básico|intermedio|avanzado|fácil|difícil|complejo|sencillo)\\b",
                "(?i)\\bdificultad\\b",
                "(?i)\\b(alta|media|baja) complejidad\\b"
        };

        // Palabras y frases a eliminar relacionadas con tiempo
        String[] patronesTiempo = {
                "(?i)\\b\\d+ minutos\\b",
                "(?i)\\b\\d+ horas?\\b",
                "(?i)\\btiempo límite\\b",
                "(?i)\\bduración\\b",
                "(?i)\\bcontra reloj\\b",
                "(?i)\\bcontrarreloj\\b"
        };

        // Aplicar las sustituciones
        for (String patron : patronesDificultad) {
            descripcion = descripcion.replaceAll(patron, "");
        }

        for (String patron : patronesTiempo) {
            descripcion = descripcion.replaceAll(patron, "");
        }

        // Eliminar frases genéricas
        descripcion = descripcion.replaceAll("(?i)esta prueba evaluará sus conocimientos", "");
        descripcion = descripcion.replaceAll("(?i)esta prueba técnica evaluará", "");

        // Limpiar espacios múltiples y puntuación incorrecta
        descripcion = descripcion.replaceAll("\\s+", " ");
        descripcion = descripcion.replaceAll("\\s+\\.", ".");
        descripcion = descripcion.replaceAll("\\s+,", ",");

        return descripcion.trim();
    }

    /**
     * Extrae manualmente la descripción y tecnologías de una respuesta de texto
     * cuando no se puede procesar como JSON.
     * 
     * @param respuesta La respuesta de texto de la IA
     * @return Mapa con la descripción y tecnologías extraídas
     */
    private Map<String, String> extraerManualmente(String respuesta) {
        Map<String, String> resultado = new HashMap<>();
        String descripcion = "";
        String tecnologias = "";

        // Extraer descripción
        Pattern patternDesc = Pattern.compile("(?i)(?:descripci[oó]n[\":]\\s*[\"]?)(.*?)(?:[\"\\n].*?tecnolog[ií]as|$)",
                Pattern.DOTALL);
        Matcher matcherDesc = patternDesc.matcher(respuesta);
        if (matcherDesc.find()) {
            descripcion = matcherDesc.group(1).trim().replaceAll("\"$", "");
        } else {
            // Intentar extraer cualquier texto descriptivo
            int indexTec = respuesta.toLowerCase().indexOf("tecnología");
            if (indexTec > 0) {
                descripcion = respuesta.substring(0, indexTec).trim();
            } else {
                descripcion = respuesta.substring(0, Math.min(respuesta.length(), 500)).trim();
            }
        }

        // Extraer tecnologías con múltiples patrones
        List<String> tecnologiasEncontradas = new ArrayList<>();

        // Patrón 1: Buscar después de la palabra "tecnologías:"
        Pattern patternTec = Pattern.compile("(?i)(?:tecnolog[ií]as[\":]\\s*[\"]?)(.*?)(?:[\"\\n]|$)", Pattern.DOTALL);
        Matcher matcherTec = patternTec.matcher(respuesta);
        if (matcherTec.find()) {
            String tecStr = matcherTec.group(1).trim().replaceAll("\"$", "");

            // Dividir por comas o puntos y comas
            String[] tecArray = tecStr.split("[,;]");
            for (String tec : tecArray) {
                String tecLimpia = tec.trim();
                if (!tecLimpia.isEmpty() && !tecnologiasEncontradas.contains(tecLimpia)) {
                    tecnologiasEncontradas.add(tecLimpia);
                }

                // Limitar a 10 tecnologías
                if (tecnologiasEncontradas.size() >= 10) {
                    break;
                }
            }
        }

        // Patrón 2: Si no se encontraron suficientes, buscar listas con guiones o
        // números
        if (tecnologiasEncontradas.size() < 10) {
            Pattern listPattern = Pattern.compile("(?i)(?:- |\\d+\\. )(.*?)(?:[\\n]|$)");
            Matcher listMatcher = listPattern.matcher(respuesta);
            while (listMatcher.find() && tecnologiasEncontradas.size() < 10) {
                String tecLimpia = listMatcher.group(1).trim();
                if (!tecLimpia.isEmpty() && !tecnologiasEncontradas.contains(tecLimpia)) {
                    tecnologiasEncontradas.add(tecLimpia);
                }
            }
        }

        // Patrón 3: Si todavía no hay suficientes, buscar palabras clave comunes de
        // tecnologías
        if (tecnologiasEncontradas.isEmpty()) {
            String[] palabrasClaveTecnologia = { "Java", "Python", "JavaScript", "HTML", "CSS", "SQL", "React",
                    "Angular", "Node.js", "Spring", "Docker", "AWS", "Azure", "Git", "REST API" };

            for (String palabra : palabrasClaveTecnologia) {
                if (respuesta.contains(palabra) && !tecnologiasEncontradas.contains(palabra)) {
                    tecnologiasEncontradas.add(palabra);

                    // Limitar a 10 tecnologías
                    if (tecnologiasEncontradas.size() >= 10) {
                        break;
                    }
                }
            }
        }

        // Unir las tecnologías encontradas
        if (!tecnologiasEncontradas.isEmpty()) {
            tecnologias = String.join(", ", tecnologiasEncontradas);
        } else {
            // Si no se pudo extraer nada, usar valores predeterminados
            tecnologias = "Programación, Desarrollo de software";
        }

        // Limpiar la descripción
        descripcion = limpiarDescripcion(descripcion);

        // Si no se pudo extraer descripción, usar valor predeterminado
        if (descripcion == null || descripcion.isEmpty()) {
            descripcion = "Esta prueba técnica evaluará sus habilidades específicas para el puesto.";
        }

        resultado.put("descripcion", descripcion);
        resultado.put("tecnologias", tecnologias);

        log.debug("Extracción manual - Descripción: {}", descripcion);
        log.debug("Extracción manual - Tecnologías: {}", tecnologias);

        return resultado;
    }

    @Override
    public Map<String, Object> generarPregunta(String tipoPregunta, String nivelDificultad) {
        try {
            log.info("Generando pregunta de tipo: {} con nivel de dificultad: {}", tipoPregunta, nivelDificultad);

            // Valor predeterminado si no se proporciona dificultad
            if (nivelDificultad == null || nivelDificultad.trim().isEmpty()) {
                nivelDificultad = "INTERMEDIO";
            }

            String prompt = "Genera una pregunta técnica de alta calidad para una prueba técnica de programación. " +
                    "La pregunta debe ser del tipo: " + tipoPregunta + ". " +
                    "El nivel de dificultad debe ser: " + nivelDificultad + ". ";

            // Personalizar el prompt según el tipo de pregunta y nivel de dificultad
            switch (tipoPregunta) {
                case "ABIERTA":
                    prompt += "Crea una pregunta abierta que requiera una respuesta detallada sobre algún concepto " +
                            "o problema de programación. La pregunta debe ser específica y clara.";
                    break;
                case "OPCION_MULTIPLE":
                    prompt += "Crea una pregunta con 4 opciones de respuesta posibles, donde solo una sea correcta. " +
                            "Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas para un profesional.";
                    break;
                case "VERDADERO_FALSO":
                    prompt += "Crea una afirmación técnica que pueda ser verdadera o falsa. " +
                            "La afirmación debe ser precisa y verificable.";
                    break;
                case "CODIGO":
                    prompt += "Crea un problema que requiera escribir código para resolverlo. " +
                            "Proporciona un enunciado claro, ejemplos de entrada/salida si es apropiado, y una solución esperada.";
                    break;
                case "TEORICA":
                    prompt += "Crea una pregunta teórica sobre fundamentos de programación, arquitectura de software, "
                            +
                            "o conceptos importantes en desarrollo de software. Debe centrarse en principios teóricos y fundamentos.";
                    break;
                case "DESARROLLO":
                    // Para compatibilidad con código existente, tratar DESARROLLO como ABIERTA
                    prompt += "Crea una pregunta abierta que requiera una respuesta detallada sobre algún concepto " +
                            "o problema de programación. La pregunta debe ser específica y clara.";
                    break;
                default:
                    prompt += "Crea una pregunta técnica relevante para evaluar conocimientos de programación.";
            }

            // Añadir instrucciones específicas según el nivel de dificultad
            switch (nivelDificultad) {
                case "BASICO":
                    prompt += " La pregunta debe ser de nivel BÁSICO, adecuada para principiantes o personas con conocimientos fundamentales. "
                            +
                            "Debe cubrir conceptos básicos y ser accesible para quienes están comenzando en el campo.";
                    break;
                case "INTERMEDIO":
                    prompt += " La pregunta debe ser de nivel INTERMEDIO, adecuada para profesionales con experiencia moderada. "
                            +
                            "Debe requerir conocimiento más allá de lo básico y capacidad para aplicar conceptos en situaciones comunes.";
                    break;
                case "AVANZADO":
                    prompt += " La pregunta debe ser de nivel AVANZADO, adecuada para profesionales experimentados. " +
                            "Debe cubrir conceptos complejos, escenarios de edge case, optimización, mejores prácticas avanzadas "
                            +
                            "o conocimientos especializados profundos en el área.";
                    break;
                default:
                    prompt += " La pregunta debe ser de nivel INTERMEDIO, adecuada para profesionales con experiencia moderada.";
            }

            prompt += "\n\nFormato de respuesta requerido (JSON):\n" +
                    "{\n" +
                    "  \"pregunta\": \"El enunciado completo de la pregunta\",\n" +
                    "  \"tipoPregunta\": \"" + tipoPregunta + "\",\n";

            if ("OPCION_MULTIPLE".equals(tipoPregunta)) {
                prompt += "  \"opciones\": \"Opción 1|Opción 2|Opción 3|Opción 4\",\n" +
                        "  \"respuestaCorrecta\": \"La opción correcta exactamente como aparece en las opciones\"\n";
            } else if ("VERDADERO_FALSO".equals(tipoPregunta)) {
                prompt += "  \"opciones\": \"Verdadero|Falso\",\n" +
                        "  \"respuestaCorrecta\": \"Verdadero o Falso según corresponda\"\n";
            } else if ("CODIGO".equals(tipoPregunta)) {
                prompt += "  \"respuestaEsperada\": \"Descripción de la solución esperada o ejemplo de código correcto\"\n";
            }

            prompt += "}";

            String respuesta = enviarSolicitudGemini(prompt);
            return extraerJSONDeRespuesta(respuesta);

        } catch (Exception e) {
            log.error("Error al generar pregunta de tipo {} con dificultad {}: {}", tipoPregunta, nivelDificultad,
                    e.getMessage(), e);
            Map<String, Object> resultadoError = new HashMap<>();
            resultadoError.put("pregunta", "Error al generar pregunta: " + e.getMessage());
            resultadoError.put("tipoPregunta", tipoPregunta);
            return resultadoError;
        }
    }

}