package com.talentmatch.model.enums;

/**
 * Enumeración que define los tipos de documentos soportados en el sistema.
 */
public enum TipoDocumento {
    CURRICULUM_VITAE("Curriculum Vitae"),
    CERTIFICADO("Certificado"),
    CARTA_RECOMENDACION("Carta de Recomendación"),
    TITULO_PROFESIONAL("Título Profesional"),
    DIPLOMA("Diploma"),
    OTRO("Otro");

    private final String descripcion;

    TipoDocumento(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
} 