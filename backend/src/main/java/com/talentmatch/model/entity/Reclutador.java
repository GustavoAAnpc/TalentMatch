package com.talentmatch.model.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.ForeignKey;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.Builder;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

import org.hibernate.annotations.BatchSize;

/**
 * Entidad que representa a un reclutador en el sistema TalentMatch.
 * Extiende de la clase Usuario y añade información específica del reclutador.
 */
@Entity
@Table(name = "reclutadores",
       indexes = {
           @Index(name = "idx_reclutadores_departamento", columnList = "departamento"),
           @Index(name = "idx_reclutadores_cargo", columnList = "cargo")
       })
@PrimaryKeyJoinColumn(name = "id", foreignKey = @ForeignKey(name = "fk_reclutadores_usuarios"))
@Data
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@ToString(callSuper = true, exclude = {"vacantes"})
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Reclutador extends Usuario {

    @Size(max = 100, message = "El puesto del reclutador no puede exceder los 100 caracteres")
    @Column(name = "puesto")
    private String puesto;

    @Size(max = 50, message = "El departamento no puede exceder los 50 caracteres")
    @Column(name = "departamento")
    private String departamento;

    @Size(max = 100, message = "La ubicación no puede exceder los 100 caracteres")
    @Column(name = "ubicacion")
    private String ubicacion;

    @Size(max = 2000, message = "La información de la empresa no puede exceder los 2000 caracteres")
    @Column(name = "info_empresa", columnDefinition = "TEXT")
    private String infoEmpresa;

    @Column(name = "cargo")
    private String cargo;

    @Column(name = "extension_telefonica")
    private String extensionTelefonica;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @OneToMany(mappedBy = "reclutador", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private Set<Vacante> vacantes = new HashSet<>();
    
    /**
     * Método que se ejecuta antes de persistir la entidad.
     * Asegura que las colecciones estén inicializadas.
     */
    @PrePersist
    protected void onPrePersist() {
        if (vacantes == null) {
            vacantes = new HashSet<>();
        }
    }
}
