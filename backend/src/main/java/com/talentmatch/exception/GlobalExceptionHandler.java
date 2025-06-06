package com.talentmatch.exception;

import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;

import lombok.extern.slf4j.Slf4j;

/**
 * Manejador global de excepciones para la aplicación.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Maneja excepciones de recurso no encontrado.
     */
    @ExceptionHandler(RecursoNoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponse> manejarRecursoNoEncontrado(RecursoNoEncontradoException ex, WebRequest request) {
        log.error("Recurso no encontrado: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Recurso no encontrado",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    /**
     * Maneja excepciones de entidad duplicada.
     */
    @ExceptionHandler(EntidadDuplicadaException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> manejarEntidadDuplicada(EntidadDuplicadaException ex, WebRequest request) {
        log.error("Entidad duplicada: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Entidad duplicada",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    /**
     * Maneja excepciones de operación inválida.
     */
    @ExceptionHandler(OperacionInvalidaException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarOperacionInvalida(OperacionInvalidaException ex, WebRequest request) {
        log.error("Operación inválida: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Operación inválida",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de acceso no autorizado.
     */
    @ExceptionHandler(AccesoNoAutorizadoException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> manejarAccesoNoAutorizado(AccesoNoAutorizadoException ex, WebRequest request) {
        log.error("Acceso no autorizado: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Acceso no autorizado",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    /**
     * Maneja excepciones de autenticación.
     */
    @ExceptionHandler(AutenticacionException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponse> manejarAutenticacion(AutenticacionException ex, WebRequest request) {
        log.error("Error de autenticación: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Error de autenticación",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Maneja excepciones de validación.
     */
    @ExceptionHandler(ValidacionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarValidacion(ValidacionException ex, WebRequest request) {
        log.error("Error de validación: {}", ex.getMessage());
        
        ErrorResponse errorResponse;
        
        if (ex.getErrores() != null && !ex.getErrores().isEmpty()) {
            errorResponse = new ErrorResponse(
                    HttpStatus.BAD_REQUEST.value(),
                    "Error de validación",
                    "Se encontraron errores de validación",
                    request.getDescription(false));
            errorResponse.setErroresValidacion(ex.getErrores());
        } else {
            errorResponse = new ErrorResponse(
                    HttpStatus.BAD_REQUEST.value(),
                    "Error de validación",
                    ex.getMessage(),
                    request.getDescription(false));
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de archivo.
     */
    @ExceptionHandler(ArchivoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarArchivo(ArchivoException ex, WebRequest request) {
        log.error("Error de archivo: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de archivo",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de servicio externo.
     */
    @ExceptionHandler(ServicioExternoException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ResponseEntity<ErrorResponse> manejarServicioExterno(ServicioExternoException ex, WebRequest request) {
        log.error("Error de servicio externo: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Error de servicio externo",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * Maneja excepciones de postulación.
     */
    @ExceptionHandler(PostulacionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarPostulacion(PostulacionException ex, WebRequest request) {
        log.error("Error de postulación: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de postulación",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de prueba técnica.
     */
    @ExceptionHandler(PruebaTecnicaException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarPruebaTecnica(PruebaTecnicaException ex, WebRequest request) {
        log.error("Error de prueba técnica: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de prueba técnica",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de validación de argumentos de método.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarValidacionArgumentos(MethodArgumentNotValidException ex, WebRequest request) {
        log.error("Error de validación de argumentos: {}", ex.getMessage());
        
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String campo = ((FieldError) error).getField();
            String mensaje = error.getDefaultMessage();
            errores.put(campo, mensaje);
        });
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de validación",
                "Se encontraron errores de validación en los argumentos",
                request.getDescription(false));
        errorResponse.setErroresValidacion(errores);
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de acceso denegado.
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> manejarAccesoDenegado(AccessDeniedException ex, WebRequest request) {
        log.error("Acceso denegado: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Acceso denegado",
                "No tienes permiso para acceder a este recurso",
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    /**
     * Maneja excepciones relacionadas con servicios de IA.
     */
    @ExceptionHandler(IAException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<?> manejarErrorIA(IAException ex, WebRequest request) {
        log.error("Error en servicio de IA: {}", ex.getMessage());
        
        // Verificar si la excepción contiene una respuesta de error detallada
        if (ex.getRespuestaError() != null) {
            // Si hay una respuesta detallada, la devolvemos con un estado 200 pero incluyendo información del error
            // Esto permite al frontend mostrar información útil al usuario
            return new ResponseEntity<>(ex.getRespuestaError(), HttpStatus.OK);
        }
        
        // Si no hay una respuesta detallada, devolvemos el formato de error estándar
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Error en servicio de IA",
                ex.getMessage(),
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Maneja errores específicos de formato de fecha.
     */
    @ExceptionHandler(DateTimeParseException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarErrorFormatoFecha(DateTimeParseException ex, WebRequest request) {
        log.error("Error de formato de fecha: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de formato de fecha",
                "El formato de fecha proporcionado no es válido. Por favor use el formato YYYY-MM-DD.",
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones de mensajes HTTP no legibles.
     * Ocurre cuando el cuerpo de la solicitud no puede ser mapeado a un objeto Java,
     * por ejemplo, debido a un formato JSON inválido o tipos de datos incompatibles.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> manejarMensajeNoLegible(HttpMessageNotReadableException ex, WebRequest request) {
        log.error("Error al leer mensaje HTTP: {}", ex.getMessage());
        
        // Obtener la causa raíz para proporcionar información más detallada
        Throwable causaRaiz = ex.getMostSpecificCause();
        String mensaje = "Error al procesar la solicitud. Formato de datos inválido.";
        
        // Verificar si es un error de formato de fecha
        if (causaRaiz instanceof DateTimeParseException || 
            (causaRaiz.getMessage() != null && causaRaiz.getMessage().contains("LocalDate"))) {
            mensaje = "El formato de fecha proporcionado no es válido. Por favor use el formato YYYY-MM-DD.";
            if (causaRaiz instanceof DateTimeParseException) {
                DateTimeParseException dtpe = (DateTimeParseException) causaRaiz;
                mensaje += " Texto no parseado: " + dtpe.getParsedString();
            }
        } else if (causaRaiz instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) causaRaiz;
            mensaje = String.format(
                "No se pudo convertir el valor '%s' al tipo %s para el campo '%s'",
                ife.getValue(),
                ife.getTargetType().getSimpleName(),
                ife.getPath().isEmpty() ? "desconocido" : ife.getPath().get(ife.getPath().size() - 1).getFieldName()
            );
        } else if (causaRaiz instanceof MismatchedInputException) {
            MismatchedInputException mie = (MismatchedInputException) causaRaiz;
            mensaje = String.format(
                "Error de formato en el campo '%s': %s",
                mie.getPath().isEmpty() ? "desconocido" : mie.getPath().get(mie.getPath().size() - 1).getFieldName(),
                mie.getMessage()
            );
        } else if (causaRaiz instanceof JsonMappingException) {
            JsonMappingException jme = (JsonMappingException) causaRaiz;
            mensaje = String.format(
                "Error al mapear JSON: %s",
                jme.getOriginalMessage()
            );
        } else if (causaRaiz instanceof JsonProcessingException) {
            mensaje = String.format(
                "Error al procesar JSON: %s",
                causaRaiz.getMessage()
            );
        }
        
        log.error("Mensaje detallado: {}", mensaje);
        log.error("Causa raíz: {}", causaRaiz.toString());
        
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error en formato de solicitud",
                mensaje,
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Maneja excepciones generales.
     * No expone detalles internos del sistema en la respuesta al cliente.
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> manejarExcepcionGeneral(Exception ex, WebRequest request) {
        // Registramos el error completo con detalles para depuración interna
        log.error("Error interno del servidor: {}", ex.getMessage(), ex);
        
        // Verificamos si es una excepción de conversión de tipos conocida
        boolean esErrorConversion = ex.getCause() instanceof IllegalArgumentException && 
                                    ex.getCause().getMessage() != null &&
                                    ex.getCause().getMessage().contains("Convert");
        
        // También verificamos si está relacionado con fechas
        boolean esErrorFecha = (ex.getMessage() != null && ex.getMessage().contains("LocalDate")) ||
                              (ex.getCause() != null && ex.getCause() instanceof DateTimeParseException);
        
        // Generamos un código de referencia único para el error
        String codigoReferencia = generarCodigoReferenciaError();
        
        // Registramos el código de referencia junto con el error para poder rastrearlo
        log.error("Código de referencia del error: {}", codigoReferencia);
        
        // Si es un error relacionado con fechas
        if (esErrorFecha) {
            String mensaje = "Error en formato de fecha. Por favor use el formato YYYY-MM-DD.";
            log.error(mensaje);
            
            ErrorResponse errorResponse = new ErrorResponse(
                    HttpStatus.BAD_REQUEST.value(),
                    "Error de formato de fecha",
                    mensaje,
                    request.getDescription(false));
            
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
        
        // Si es un error de conversión conocido, proporcionamos información más específica
        if (esErrorConversion) {
            String mensaje = "Error al convertir tipos de datos: " + ex.getCause().getMessage();
            log.error(mensaje);
            
            ErrorResponse errorResponse = new ErrorResponse(
                    HttpStatus.BAD_REQUEST.value(),
                    "Error de conversión de datos",
                    mensaje,
                    request.getDescription(false));
            
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
        
        // Creamos una respuesta genérica sin exponer detalles internos
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Error interno del servidor",
                "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde. " +
                "Si el problema persiste, contacte al soporte técnico con el código de referencia: " + codigoReferencia,
                request.getDescription(false));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Genera un código de referencia único para errores.
     * 
     * @return Código de referencia único
     */
    private String generarCodigoReferenciaError() {
        return "ERR-" + System.currentTimeMillis() + "-" + 
               String.format("%04d", (int)(Math.random() * 10000));
    }

    /**
     * Clase para representar una respuesta de error.
     */
    public static class ErrorResponse {
        private final int estado;
        private final String tipo;
        private final String mensaje;
        private final String ruta;
        private final long timestamp;
        private Map<String, String> erroresValidacion;

        public ErrorResponse(int estado, String tipo, String mensaje, String ruta) {
            this.estado = estado;
            this.tipo = tipo;
            this.mensaje = mensaje;
            this.ruta = ruta;
            this.timestamp = System.currentTimeMillis();
        }

        public int getEstado() {
            return estado;
        }

        public String getTipo() {
            return tipo;
        }

        public String getMensaje() {
            return mensaje;
        }

        public String getRuta() {
            return ruta;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public Map<String, String> getErroresValidacion() {
            return erroresValidacion;
        }

        public void setErroresValidacion(Map<String, String> erroresValidacion) {
            this.erroresValidacion = erroresValidacion;
        }
    }
}
