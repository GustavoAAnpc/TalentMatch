package com.talentmatch.exception;

import com.talentmatch.dto.response.EmparejamientoResponse;

/**
 * Excepción personalizada para servicios de inteligencia artificial.
 */
public class IAException extends ExcepcionBase {
    
    private static final String CODIGO_ERROR = "ERROR_IA";
    private EmparejamientoResponse respuestaError;
    
    /**
     * Constructor con mensaje de error.
     * 
     * @param mensaje Mensaje descriptivo del error
     */
    public IAException(String mensaje) {
        super(mensaje, CODIGO_ERROR);
    }

    /**
     * Constructor con mensaje y causa.
     * 
     * @param mensaje Mensaje descriptivo del error
     * @param causa Causa raíz del error
     */
    public IAException(String mensaje, Throwable causa) {
        super(mensaje, causa, CODIGO_ERROR);
    }
    
    /**
     * Constructor para errores específicos de servicios de IA.
     * 
     * @param servicio Nombre del servicio de IA
     * @param detalle Detalle del error
     */
    public IAException(String servicio, String detalle) {
        super("Error en servicio de IA: " + servicio + ". Detalle: " + detalle, CODIGO_ERROR);
    }
    
    /**
     * Constructor para errores específicos de servicios de IA con respuesta de error.
     * 
     * @param servicio Nombre del servicio de IA
     * @param detalle Detalle del error
     * @param respuestaError Respuesta de error con información adicional
     */
    public IAException(String servicio, String detalle, EmparejamientoResponse respuestaError) {
        super("Error en servicio de IA: " + servicio + ". Detalle: " + detalle, CODIGO_ERROR);
        this.respuestaError = respuestaError;
    }
    
    /**
     * Obtiene la respuesta de error con información adicional.
     * 
     * @return Respuesta de error o null si no hay una respuesta asociada
     */
    public EmparejamientoResponse getRespuestaError() {
        return respuestaError;
    }
} 