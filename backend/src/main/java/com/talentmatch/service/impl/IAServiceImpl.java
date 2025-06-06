package com.talentmatch.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Objects;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.dto.request.AnalisisPerfilRequest;
import com.talentmatch.dto.response.AnalisisPerfilResponse;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.dto.response.EmparejamientoResponse;
import com.talentmatch.dto.response.VacanteResumenResponse;
import com.talentmatch.exception.IAException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Postulacion;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.enums.EstadoVacante;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.PostulacionRepository;
import com.talentmatch.repository.VacanteRepository;
import com.talentmatch.service.IAService;
import com.talentmatch.service.IntegracionIAService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de IA.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class IAServiceImpl implements IAService {

    private final CandidatoRepository candidatoRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulacionRepository postulacionRepository;
    private final IntegracionIAService integracionIAService;

    @Override
    public List<VacanteResumenResponse> recomendarVacantes(Long candidatoId, int limite) {
        try {
            // Utilizamos el servicio de integración para obtener las vacantes recomendadas
            List<Map<String, Object>> vacantesRecomendadas = integracionIAService.sugerirVacantes(candidatoId);
            
            // Limitamos los resultados según el parámetro
            return vacantesRecomendadas.stream()
                    .limit(limite)
                    .map(this::mapToVacanteResumen)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error al recomendar vacantes: {}", e.getMessage());
            throw new IAException("Recomendación de vacantes", e.getMessage());
        }
    }

    @Override
    public List<CandidatoResponse> recomendarCandidatos(Long vacanteId, int limite) {
        try {
            // Utilizamos el servicio de integración para obtener el ranking de candidatos
            List<Map<String, Object>> candidatosRanking = integracionIAService.generarRankingCandidatos(vacanteId);
            
            // Limitamos los resultados según el parámetro
            return candidatosRanking.stream()
                    .limit(limite)
                    .map(this::mapToCandidatoResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error al recomendar candidatos: {}", e.getMessage());
            throw new IAException("Recomendación de candidatos", e.getMessage());
        }
    }

    @Override
    public EmparejamientoResponse calcularEmparejamiento(Long candidatoId, Long vacanteId) {
        try {
            log.info("Iniciando cálculo de emparejamiento entre candidato ID: {} y vacante ID: {}", candidatoId, vacanteId);
            
            // Verificar si el candidato y la vacante existen
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Candidato no encontrado con ID: " + candidatoId));
            
            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Vacante no encontrada con ID: " + vacanteId));
            
            // Verificar si ya existe una postulación (solo para información)
            Optional<Postulacion> postulacionExistente = postulacionRepository.findByCandidatoAndVacante(candidato, vacante);
            
            if (postulacionExistente.isPresent()) {
                log.info("Se encontró una postulación existente con puntuación: {}", 
                        postulacionExistente.get().getPuntuacionMatch());
            }
            
            // Siempre calculamos un nuevo valor usando la IA
            // Utilizamos el servicio de integración para evaluar la compatibilidad
            Map<String, Object> compatibilidad = integracionIAService.evaluarCompatibilidad(candidatoId, vacanteId);
            
            // Extraer datos de la respuesta
            Integer porcentajeCalculado = null;
            List<String> fortalezas = new ArrayList<>();
            List<String> debilidades = new ArrayList<>();
            List<String> recomendaciones = new ArrayList<>();
            String mensajeCandidato = null;
            String mensajeReclutador = null;
            
            // Procesar el resultado para extraer el porcentaje
            if (compatibilidad.containsKey("porcentaje")) {
                Object porcentajeObj = compatibilidad.get("porcentaje");
                porcentajeCalculado = extraerValorEntero(porcentajeObj);
            }
            
            // Si no se pudo obtener el porcentaje, usar un valor por defecto
            if (porcentajeCalculado == null) {
                porcentajeCalculado = 0;
                log.warn("No se pudo obtener el porcentaje del resultado, usando valor por defecto");
            }
            
            // Extraer listas y mensajes de manera segura
            fortalezas = extraerListaString(compatibilidad, "fortalezas");
            debilidades = extraerListaString(compatibilidad, "debilidades");
            recomendaciones = extraerListaString(compatibilidad, "recomendaciones");
            
            // Extraer mensajes para candidato y reclutador
            if (compatibilidad.containsKey("mensajeCandidato") && compatibilidad.get("mensajeCandidato") != null) {
                mensajeCandidato = compatibilidad.get("mensajeCandidato").toString();
            }
            
            if (compatibilidad.containsKey("mensajeReclutador") && compatibilidad.get("mensajeReclutador") != null) {
                mensajeReclutador = compatibilidad.get("mensajeReclutador").toString();
            }
            
            // Si existe una postulación, actualizar su puntuación
            if (postulacionExistente.isPresent()) {
                Postulacion postulacion = postulacionExistente.get();
                Integer puntuacionPrevia = postulacion.getPuntuacionMatch();
                
                // Solo actualizamos si la puntuación es diferente
                if (!Objects.equals(puntuacionPrevia, porcentajeCalculado)) {
                    postulacion.setPuntuacionMatch(porcentajeCalculado);
                    postulacionRepository.save(postulacion);
                    log.info("Actualizada puntuación de postulación de {} a {}", 
                            puntuacionPrevia, porcentajeCalculado);
                } else {
                    log.info("La puntuación calculada ({}) es igual a la almacenada, no se actualiza", 
                            porcentajeCalculado);
                }
            }
            
            // Crear respuesta
            EmparejamientoResponse respuesta = new EmparejamientoResponse();
            respuesta.setPorcentaje(porcentajeCalculado);
            respuesta.setFortalezas(fortalezas);
            respuesta.setDebilidades(debilidades);
            respuesta.setRecomendaciones(recomendaciones);
            respuesta.setFechaCalculo(LocalDateTime.now());
            respuesta.setMensajeCandidato(mensajeCandidato);
            respuesta.setMensajeReclutador(mensajeReclutador);
            
            // Añadir información adicional
            llenarInformacionAdicional(respuesta, vacante);
            
            log.info("Emparejamiento calculado con éxito: {}% para candidato {} y vacante {}", 
                    porcentajeCalculado, candidatoId, vacanteId);
            
            return respuesta;
        } catch (Exception e) {
            log.error("Error al calcular emparejamiento: {}", e.getMessage(), e);
            
            // Crear una respuesta informativa de error
            EmparejamientoResponse respuestaError = new EmparejamientoResponse();
            respuestaError.setPorcentaje(0);
            respuestaError.setFortalezas(List.of());
            respuestaError.setDebilidades(List.of("No se pudo completar el análisis de compatibilidad"));
            respuestaError.setRecomendaciones(List.of(
                "Intente nuevamente en unos minutos", 
                "Asegúrese de que su perfil y la vacante contengan información completa"
            ));
            respuestaError.setFechaCalculo(LocalDateTime.now());
            
            // Proporcionar mensajes informativos y útiles para el usuario
            respuestaError.setMensajeCandidato(
                "En este momento no hemos podido completar el análisis de compatibilidad entre tu perfil y esta vacante " +
                "debido a un problema técnico. Para mejorar los resultados, te recomendamos verificar que tu perfil " +
                "tenga información completa y actualizada, especialmente en las secciones de habilidades y experiencia. " +
                "Por favor, intenta nuevamente en unos minutos."
            );
            
            respuestaError.setMensajeReclutador(
                "Se ha producido un error al analizar la compatibilidad de este candidato con la vacante. " +
                "El error específico fue: \"" + e.getMessage() + "\". " +
                "Le recomendamos verificar que tanto el perfil del candidato como la vacante contengan información " +
                "completa y detallada, especialmente en cuanto a habilidades requeridas y experiencia. " +
                "Considere realizar una evaluación manual o intentar nuevamente más tarde."
            );
            
            throw new IAException("Error en cálculo de emparejamiento", e.getMessage(), respuestaError);
        }
    }

    /**
     * Extrae un valor entero de diferentes tipos de objetos (Integer, Double, String).
     * 
     * @param valor Objeto que contiene el valor
     * @return Valor extraído como Integer o null si no se pudo extraer
     */
    private Integer extraerValorEntero(Object valor) {
        if (valor == null) {
            return null;
        }
        
        if (valor instanceof Integer) {
            return (Integer) valor;
        } else if (valor instanceof Double) {
            return ((Double) valor).intValue();
        } else if (valor instanceof Long) {
            return ((Long) valor).intValue();
        } else if (valor instanceof String) {
            try {
                return Integer.parseInt((String) valor);
            } catch (NumberFormatException e) {
                log.warn("No se pudo convertir el valor '{}' a entero", valor);
                return null;
            }
        } else if (valor instanceof Number) {
            return ((Number) valor).intValue();
        }
        
        log.warn("Tipo de objeto no reconocido para convertir a entero: {}", valor.getClass().getName());
        return null;
    }

    /**
     * Extrae una lista de strings de un mapa de forma segura.
     * 
     * @param mapa Mapa con los datos
     * @param clave Clave para buscar en el mapa
     * @return Lista de strings extraída o lista vacía si no se pudo extraer
     */
    private List<String> extraerListaString(Map<String, Object> mapa, String clave) {
        if (mapa == null || !mapa.containsKey(clave)) {
            return new ArrayList<>();
        }
        
        Object valor = mapa.get(clave);
        
        if (valor instanceof List<?>) {
            List<?> lista = (List<?>) valor;
            List<String> resultado = new ArrayList<>();
            
            for (Object item : lista) {
                if (item instanceof String) {
                    resultado.add((String) item);
                } else if (item != null) {
                    resultado.add(item.toString());
                }
            }
            
            return resultado;
        } else if (valor instanceof String) {
            // Si se recibió un solo string, lo convertimos en una lista
            return List.of((String) valor);
        } else if (valor instanceof String[]) {
            // Si se recibió un array de strings
            return Arrays.asList((String[]) valor);
        }
        
        log.warn("No se pudo extraer una lista del campo {}, tipo: {}", 
                clave, valor != null ? valor.getClass().getName() : "null");
        return new ArrayList<>();
    }

    @Override
    public AnalisisPerfilResponse analizarPerfil(AnalisisPerfilRequest request) {
        try {
            // Utilizamos el servicio de integración para obtener información del candidato
            Long candidatoId = request.getCandidatoId();
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Candidato no encontrado con ID: " + candidatoId));
            
            // Obtener sugerencias reales del servicio de integración
            List<String> sugerencias = integracionIAService.sugerirMejorasPerfil(candidatoId);
            
            // Obtener datos del perfil para análisis más preciso
            List<String> puntosFuertes = new ArrayList<>();
            List<String> puntosDebiles = new ArrayList<>();
            
            // Analizar habilidades y experiencia para determinar puntos fuertes y débiles
            if (candidato.getHabilidadesPrincipales() != null && !candidato.getHabilidadesPrincipales().isEmpty()) {
                puntosFuertes.add("Habilidades destacadas en " + candidato.getHabilidadesPrincipales());
            } else {
                puntosDebiles.add("Perfil de habilidades incompleto");
            }
            
            // Analizar experiencia
            Integer experienciaAnios = candidato.getExperienciaAnios();
            if (experienciaAnios != null) {
                if (experienciaAnios > 3) {
                    puntosFuertes.add("Experiencia profesional sólida de " + experienciaAnios + " años");
                } else if (experienciaAnios >= 1) {
                puntosFuertes.add("Experiencia laboral relevante");
            } else {
                puntosDebiles.add("Experiencia laboral limitada");
                }
            } else {
                puntosDebiles.add("No se ha especificado la experiencia laboral");
            }
            
            // Creamos la respuesta con la información obtenida
            AnalisisPerfilResponse respuesta = new AnalisisPerfilResponse();
            respuesta.setPuntosFuertes(puntosFuertes);
            respuesta.setPuntosDebiles(puntosDebiles);
            respuesta.setRecomendaciones(sugerencias);
            
            // Calcular puntuación basada en completitud del perfil (1-100)
            int puntuacion = calcularPuntuacionPerfil(candidato);
            respuesta.setPuntuacion(puntuacion);
            
            return respuesta;
        } catch (Exception e) {
            log.error("Error al analizar perfil: {}", e.getMessage());
            throw new IAException("Análisis de perfil", e.getMessage());
        }
    }
    
    /**
     * Calcula la puntuación del perfil basada en su completitud.
     * 
     * @param candidato El candidato a evaluar
     * @return Puntuación de 1 a 100
     */
    private int calcularPuntuacionPerfil(Candidato candidato) {
        int puntuacion = 50; // Puntuación base
        
        // Evaluar completitud de campos importantes
        if (candidato.getResumenPerfil() != null && !candidato.getResumenPerfil().isEmpty()) {
            puntuacion += 10;
        }
        
        if (candidato.getHabilidadesPrincipales() != null && !candidato.getHabilidadesPrincipales().isEmpty()) {
            puntuacion += 15;
        }
        
        if (candidato.getTituloProfesional() != null && !candidato.getTituloProfesional().isEmpty()) {
            puntuacion += 10;
        }
        
        Integer experienciaAnios = candidato.getExperienciaAnios();
        if (experienciaAnios != null && experienciaAnios > 0) {
            puntuacion += Math.min(15, experienciaAnios * 3);
        }
        
        return Math.min(100, puntuacion);
    }

    @Override
    public String generarDescripcionVacante(Long vacanteId) {
        try {
            // Obtener datos de la vacante
            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(() -> new IllegalArgumentException("Vacante no encontrada"));
            
            // Construir un prompt detallado para la IA
            String prompt = "Genera una descripción profesional, atractiva y detallada para una vacante de " + 
                    vacante.getTitulo() + " en la empresa Vertex, con los siguientes requisitos: " + 
                    vacante.getHabilidadesRequeridas() + 
                    ". Requisitos adicionales: " + (vacante.getRequisitosAdicionales() != null ? vacante.getRequisitosAdicionales() : "No especificados") +
                    ". La empresa ofrece los siguientes beneficios: " + vacante.getBeneficios() +
                    ". Tipo de contrato: " + vacante.getTipoContrato() +
                    ". Ubicación: " + vacante.getUbicacion() +
                    ". Salario: Entre " + vacante.getSalarioMinimo() + " y " + vacante.getSalarioMaximo() + 
                    ". Experiencia mínima requerida: " + vacante.getExperienciaMinima() + " años" +
                    ".\n\nLa descripción debe ser convincente, destacando el valor de trabajar en Vertex y específica para atraer a los mejores talentos en este campo. Incluye secciones claras sobre responsabilidades, requisitos y beneficios. El tono debe ser profesional pero accesible. Máximo 500 palabras.";
            
            log.info("Enviando prompt para generar descripción de vacante: {}", prompt);
            
            // Implementación real: enviar el prompt a la API de IA para generar la descripción
            // Usamos el servicio de integración para esto
            String descripcion = integracionIAService.generarRetroalimentacion(vacanteId);
            
            // Si no se obtuvo una respuesta adecuada, intentar con un enfoque alternativo
            if (descripcion == null || descripcion.isEmpty() || descripcion.length() < 100) {
                // Intentar con un enfoque directo a través de Gemini API
                try {
                    Map<String, Object> datosVacante = new HashMap<>();
                    datosVacante.put("vacanteId", vacanteId);
                    datosVacante.put("titulo", vacante.getTitulo());
                    datosVacante.put("empresa", "Vertex");
                    datosVacante.put("habilidades", vacante.getHabilidadesRequeridas());
                    datosVacante.put("beneficios", vacante.getBeneficios());
                    datosVacante.put("prompt", prompt); // Añadimos el prompt aquí
                    
                    // Acceder directamente a la API
                    descripcion = generarDescripcionDirecta(datosVacante);
                    
                    if (descripcion == null || descripcion.isEmpty()) {
                        throw new Exception("No se pudo generar descripción con enfoque alternativo");
                    }
                } catch (Exception e) {
                    log.error("Error en enfoque alternativo: {}", e.getMessage());
                    throw e;
                }
            }
            
            return descripcion;
        } catch (Exception e) {
            log.error("Error al generar descripción de vacante: {}", e.getMessage());
            throw new IAException("Generación de descripción", e.getMessage());
        }
    }
    
    /**
     * Método alternativo para generar una descripción de vacante.
     * 
     * @param datosVacante Mapa con datos de la vacante
     * @return Descripción generada
     */
    private String generarDescripcionDirecta(Map<String, Object> datosVacante) {
        String titulo = (String) datosVacante.get("titulo");
        String empresa = (String) datosVacante.get("empresa");
        String habilidades = (String) datosVacante.get("habilidades");
        String beneficios = (String) datosVacante.get("beneficios");
        String prompt = (String) datosVacante.get("prompt");
        
        // Si tenemos un prompt, intentar usarlo directamente con un servicio externo
        if (prompt != null && !prompt.isEmpty()) {
            log.info("Utilizando prompt directo para generar descripción");
            try {
                // Aquí iría la llamada a un servicio externo utilizando el prompt
                // Por ahora, seguimos con la generación simple
            } catch (Exception e) {
                log.warn("Error al utilizar servicio externo con prompt: {}", e.getMessage());
            }
        }
        
        // Generar una descripción básica basada en los datos disponibles
        StringBuilder descripcion = new StringBuilder();
        descripcion.append("# Vacante: ").append(titulo).append(" en ").append(empresa).append("\n\n");
        descripcion.append("## Acerca del puesto\n");
        descripcion.append("Estamos buscando un/a profesional en ").append(titulo);
        descripcion.append(" para unirse a nuestro equipo en Vertex. ");
        descripcion.append("La persona seleccionada tendrá la oportunidad de trabajar en un entorno dinámico ");
        descripcion.append("y colaborativo, contribuyendo a proyectos innovadores en el sector.\n\n");
        
        descripcion.append("## Requisitos\n");
        String[] habilidadesArray = habilidades.split("[,;]");
        for (String habilidad : habilidadesArray) {
            if (!habilidad.trim().isEmpty()) {
                descripcion.append("- ").append(habilidad.trim()).append("\n");
            }
        }
        descripcion.append("\n");
        
        descripcion.append("## Beneficios\n");
        String[] beneficiosArray = beneficios.split("[,;]");
        for (String beneficio : beneficiosArray) {
            if (!beneficio.trim().isEmpty()) {
                descripcion.append("- ").append(beneficio.trim()).append("\n");
            }
        }
        
        descripcion.append("\n¡Únete a nuestro equipo y forma parte del éxito de Vertex!");
        
        return descripcion.toString();
    }

    /**
     * Convierte un mapa de datos de vacante a un objeto VacanteResumenResponse.
     * 
     * @param vacanteData Mapa con los datos de la vacante
     * @return Objeto VacanteResumenResponse
     */
    private VacanteResumenResponse mapToVacanteResumen(Map<String, Object> vacanteData) {
        Long vacanteId = (Long) vacanteData.get("vacanteId");
        Integer compatibilidad = (Integer) vacanteData.get("compatibilidad");
        
        // En una implementación real, obtendríamos los datos de la vacante de la base de datos
        Vacante vacante = vacanteRepository.findById(vacanteId)
                .orElseThrow(() -> new IllegalArgumentException("Vacante no encontrada"));
        
        VacanteResumenResponse respuesta = new VacanteResumenResponse();
        respuesta.setId(vacanteId);
        respuesta.setTitulo(vacante.getTitulo());
        respuesta.setUbicacion(vacante.getUbicacion());
        respuesta.setSalario(vacante.getSalarioMinimo() != null ? BigDecimal.valueOf(vacante.getSalarioMinimo()) : null); // Convertir Double a BigDecimal
        respuesta.setModalidad(null); // Convertir String a Modalidad enum si es necesario
        respuesta.setCompatibilidad(compatibilidad);
        
        return respuesta;
    }
    
    /**
     * Convierte un mapa de datos de candidato a un objeto CandidatoResponse.
     * 
     * @param candidatoData Mapa con los datos del candidato
     * @return Objeto CandidatoResponse
     */
    private CandidatoResponse mapToCandidatoResponse(Map<String, Object> candidatoData) {
        Long candidatoId = (Long) candidatoData.get("candidatoId");
        Integer puntuacion = (Integer) candidatoData.get("puntuacion");
        String justificacion = (String) candidatoData.get("justificacion");
        
        // En una implementación real, obtendríamos los datos del candidato de la base de datos
        Candidato candidato = candidatoRepository.findById(candidatoId)
                .orElseThrow(() -> new IllegalArgumentException("Candidato no encontrado"));
        
        CandidatoResponse respuesta = new CandidatoResponse();
        respuesta.setId(candidatoId);
        respuesta.setNombre(candidato.getNombre());
        respuesta.setApellido(candidato.getApellido());
        respuesta.setEmail(candidato.getEmail());
        respuesta.setTelefono(candidato.getTelefono());
        respuesta.setPuntuacion(puntuacion);
        respuesta.setJustificacion(justificacion);
        
        return respuesta;
    }

    @Override
    public Map<String, Object> analizarCandidatosPostulados(Long vacanteId) {
        try {
            // Obtener la vacante
            Vacante vacante = vacanteRepository.findById(vacanteId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Vacante no encontrada con ID: " + vacanteId));
            
            // Obtener las postulaciones a esta vacante
            List<Postulacion> postulaciones = postulacionRepository.findByVacante(vacante);
            
            if (postulaciones.isEmpty()) {
                Map<String, Object> resultadoVacio = new HashMap<>();
                resultadoVacio.put("mensaje", "No hay candidatos postulados para esta vacante");
                resultadoVacio.put("cantidad", 0);
                resultadoVacio.put("resultados", new ArrayList<>());
                return resultadoVacio;
            }
            
            // Obtener el ranking de candidatos usando la IA
            List<Map<String, Object>> rankingCandidatos = integracionIAService.generarRankingCandidatos(vacanteId);
            
            // Crear el mapa de resultado
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("vacante", vacante.getTitulo());
            resultado.put("cantidad", postulaciones.size());
            resultado.put("ranking", rankingCandidatos);
            
            // Calcular estadísticas sobre los candidatos
            Map<String, Object> estadisticas = new HashMap<>();
            
            // Promedio de compatibilidad
            double promedioCompatibilidad = postulaciones.stream()
                    .mapToInt(Postulacion::getPuntuacionMatch)
                    .average()
                    .orElse(0.0);
            
            estadisticas.put("promedioCompatibilidad", Math.round(promedioCompatibilidad * 10) / 10.0);
            
            // Candidato con mayor puntuación
            postulaciones.stream()
                    .max(Comparator.comparingInt(Postulacion::getPuntuacionMatch))
                    .ifPresent(mejor -> {
                        Map<String, Object> mejorCandidato = new HashMap<>();
                        mejorCandidato.put("id", mejor.getCandidato().getId());
                        mejorCandidato.put("nombre", mejor.getCandidato().getNombre() + " " + mejor.getCandidato().getApellido());
                        mejorCandidato.put("puntuacion", mejor.getPuntuacionMatch());
                        estadisticas.put("mejorCandidato", mejorCandidato);
                    });
            
            // Distribución por nivel de experiencia
            Map<String, Long> distribucionExperiencia = postulaciones.stream()
                    .collect(Collectors.groupingBy(
                            p -> categorizarExperiencia(p.getCandidato().getExperienciaAnios()),
                            Collectors.counting()
                    ));
            estadisticas.put("distribucionExperiencia", distribucionExperiencia);
            
            resultado.put("estadisticas", estadisticas);
            
            return resultado;
        } catch (Exception e) {
            log.error("Error al analizar candidatos postulados: {}", e.getMessage());
            throw new IAException("Análisis de candidatos", e.getMessage());
        }
    }

    /**
     * Categoriza la experiencia en niveles descriptivos.
     */
    private String categorizarExperiencia(int anios) {
        if (anios < 1) return "Sin experiencia";
        if (anios < 3) return "Junior";
        if (anios < 6) return "Semi-senior";
        if (anios < 10) return "Senior";
        return "Experto";
    }

    @Override
    public List<EmparejamientoResponse> calcularEmparejamientosCandidato(Long candidatoId, int limite) {
        try {
            log.info("Calculando emparejamientos para candidato ID: {} con límite: {}", candidatoId, limite);
            
            // Verificar que el candidato existe
            Candidato candidato = candidatoRepository.findById(candidatoId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Candidato no encontrado con ID: " + candidatoId));
                
            // Verificar si el candidato tiene información suficiente para el matching
            boolean perfilIncompleto = false;
            List<String> camposFaltantes = new ArrayList<>();
            
            if (candidato.getHabilidadesPrincipales() == null || candidato.getHabilidadesPrincipales().isEmpty()) {
                perfilIncompleto = true;
                camposFaltantes.add("habilidades principales");
            }
            
            if (candidato.getExperienciaAnios() == null) {
                perfilIncompleto = true;
                camposFaltantes.add("años de experiencia");
            }
            
            if (perfilIncompleto) {
                log.warn("El candidato ID: {} tiene un perfil incompleto. Faltan: {}", 
                        candidatoId, String.join(", ", camposFaltantes));
                
                // Intentaremos hacer matching con lo que tenemos, pero advertimos al usuario
            }
            
            // Verificar CV
            if (candidato.getUrlCurriculum() == null || candidato.getUrlCurriculum().isEmpty()) {
                log.warn("El candidato ID: {} no tiene currículum cargado", candidatoId);
            }
            
            // Obtener vacantes activas
            List<Vacante> vacantesActivas = vacanteRepository.findByEstado(EstadoVacante.ACTIVA);
            
            if (vacantesActivas.isEmpty()) {
                log.warn("No hay vacantes activas disponibles para el candidato ID: {}", candidatoId);
                return new ArrayList<>();
            }
            
            // Si hay demasiadas vacantes, limitar la cantidad
            if (vacantesActivas.size() > limite) {
                log.info("Limitando el número de vacantes de {} a {}", vacantesActivas.size(), limite);
                vacantesActivas = vacantesActivas.subList(0, limite);
            }
            
            log.info("Procesando {} vacantes activas para el candidato {}", vacantesActivas.size(), candidatoId);
            
            // Calcular emparejamiento para cada vacante
            List<EmparejamientoResponse> resultados = Collections.synchronizedList(new ArrayList<>());
            
            // Definir un Executor para procesar en paralelo
            ExecutorService executor = Executors.newFixedThreadPool(
                    Math.min(5, Runtime.getRuntime().availableProcessors())
            );
            
            List<Future<?>> futures = new ArrayList<>();
            
            for (Vacante vacante : vacantesActivas) {
                Future<?> future = executor.submit(() -> {
                    try {
                        EmparejamientoResponse emparejamiento = calcularEmparejamiento(candidatoId, vacante.getId());
                        resultados.add(emparejamiento);
                    } catch (Exception e) {
                        log.warn("Error al calcular emparejamiento para vacante ID {}: {}", 
                                vacante.getId(), e.getMessage());
                        // Continuamos con la siguiente vacante
                    }
                });
                futures.add(future);
            }
            
            // Esperar a que todos los cálculos terminen
            for (Future<?> future : futures) {
                try {
                    future.get(30, TimeUnit.SECONDS); // Timeout de 30 segundos por cada cálculo
                } catch (Exception e) {
                    log.warn("Timeout o error al calcular emparejamiento: {}", e.getMessage());
                }
            }
            
            // Apagar el executor
            executor.shutdown();
            try {
                if (!executor.awaitTermination(1, TimeUnit.MINUTES)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
            
            // Ordenar por porcentaje de mayor a menor
            resultados.sort(Comparator.comparing(EmparejamientoResponse::getPorcentaje).reversed());
            
            log.info("Emparejamientos calculados con éxito para candidato ID: {}, total: {}", 
                    candidatoId, resultados.size());
            
            return resultados;
        } catch (Exception e) {
            log.error("Error al calcular emparejamientos para candidato: {}", e.getMessage(), e);
            throw new IAException("Cálculo de emparejamientos", e.getMessage());
        }
    }

    /**
     * Rellena la información adicional de la respuesta de emparejamiento.
     * 
     * @param respuesta Respuesta a completar
     * @param vacante Vacante relacionada
     */
    private void llenarInformacionAdicional(EmparejamientoResponse respuesta, Vacante vacante) {
        // Añadir información adicional para mostrar al usuario
        respuesta.setNombreVacante(vacante.getTitulo());
        
        // Extraer habilidades requeridas de forma segura
        List<String> habilidadesRequeridas = new ArrayList<>();
        if (vacante.getHabilidadesRequeridas() != null && !vacante.getHabilidadesRequeridas().isEmpty()) {
            habilidadesRequeridas = Arrays.asList(vacante.getHabilidadesRequeridas().split("[,;]"));
        }
        respuesta.setHabilidadesRequeridas(habilidadesRequeridas);

        // Extraer los mensajes para candidato y reclutador si existen en la respuesta de la IA
        if (respuesta.getMensajeCandidato() == null || respuesta.getMensajeCandidato().isEmpty()) {
            StringBuilder mensajeCandidato = new StringBuilder();
            mensajeCandidato.append("Hemos analizado tu perfil y encontramos una compatibilidad del ")
                           .append(respuesta.getPorcentaje())
                           .append("% con la vacante de ")
                           .append(vacante.getTitulo())
                           .append(" en Vertex. ");
            
            if (respuesta.getPorcentaje() >= 70) {
                mensajeCandidato.append("Tu perfil muestra una excelente alineación con los requisitos de este puesto. ");
                mensajeCandidato.append("Te recomendamos completar tu postulación cuanto antes para avanzar en el proceso de selección.");
            } else if (respuesta.getPorcentaje() >= 50) {
                mensajeCandidato.append("Tu perfil cumple con varios de los requisitos principales para este puesto. ");
                mensajeCandidato.append("Considera destacar tus fortalezas específicas relacionadas con esta posición al completar tu postulación.");
            } else {
                mensajeCandidato.append("Aunque tu perfil muestra algunas fortalezas, existen áreas de mejora para aumentar tu compatibilidad con esta posición. ");
                mensajeCandidato.append("Te recomendamos revisar los requisitos detallados y enfocarte en desarrollar las habilidades específicas que busca Vertex para este rol.");
            }
            
            respuesta.setMensajeCandidato(mensajeCandidato.toString());
        }
        
        if (respuesta.getMensajeReclutador() == null || respuesta.getMensajeReclutador().isEmpty()) {
            StringBuilder mensajeReclutador = new StringBuilder();
            mensajeReclutador.append("El análisis de compatibilidad indica un ")
                            .append(respuesta.getPorcentaje())
                            .append("% de coincidencia entre el perfil del candidato y los requisitos de la vacante. ");
            
            if (respuesta.getPorcentaje() >= 70) {
                mensajeReclutador.append("Este candidato cumple o supera la mayoría de los requisitos clave para la posición. ");
                mensajeReclutador.append("Se recomienda avanzar con el proceso de selección y evaluar sus habilidades técnicas y competencias blandas en una entrevista personalizada.");
            } else if (respuesta.getPorcentaje() >= 50) {
                mensajeReclutador.append("Este candidato cumple parcialmente con los requisitos para la posición. ");
                mensajeReclutador.append("Podría considerarse para una evaluación adicional, enfocándose en verificar las habilidades específicas donde muestra carencias.");
            } else {
                mensajeReclutador.append("Este candidato muestra una compatibilidad limitada con los requisitos de la posición. ");
                mensajeReclutador.append("Se recomienda revisar candidatos con mayor alineación o considerar a este perfil para otras vacantes más adecuadas a sus habilidades actuales.");
            }
            
            respuesta.setMensajeReclutador(mensajeReclutador.toString());
        }
    }
} 