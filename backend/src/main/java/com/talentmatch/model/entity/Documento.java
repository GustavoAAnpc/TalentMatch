package com.talentmatch.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entidad que representa un documento en el sistema TalentMatch.
 * Puede ser un CV, certificado, carta de recomendación, etc.
 */
@Entity
@Table(name = "documentos",
       indexes = {
           @Index(name = "idx_documentos_tipo", columnList = "tipo"),
           @Index(name = "idx_documentos_fecha_creacion", columnList = "fecha_creacion")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"candidato"})
@EqualsAndHashCode(of = "id")
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El candidato es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_documentos_candidatos"))
    private Candidato candidato;

    @NotBlank(message = "El nombre del documento es obligatorio")
    @Size(max = 255, message = "El nombre del documento no puede exceder los 255 caracteres")
    @Column(name = "nombre", nullable = false)
    private String nombre;

    @NotBlank(message = "El tipo de documento es obligatorio")
    @Size(max = 50, message = "El tipo de documento no puede exceder los 50 caracteres")
    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Size(max = 500, message = "La descripción no puede exceder los 500 caracteres")
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @NotBlank(message = "La URL del documento es obligatoria")
    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "es_principal")
    private Boolean esPrincipal;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onPrePersist() {
        fechaCreacion = LocalDateTime.now();
        if (esPrincipal == null) {
            esPrincipal = false;
        }
    }

    @PreUpdate
    protected void onPreUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
} 