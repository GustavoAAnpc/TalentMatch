package com.talentmatch.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entidad que representa una habilidad técnica de un candidato.
 */
@Entity
@Table(name = "habilidades",
       indexes = {
           @Index(name = "idx_habilidades_candidato", columnList = "candidato_id"),
           @Index(name = "idx_habilidades_nombre", columnList = "name")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_candidato_habilidad", columnNames = {"candidato_id", "name"})
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"candidato"})
public class Habilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_habilidades_candidatos"))
    private Candidato candidato;

    @NotBlank(message = "El nombre de la habilidad es requerido")
    @Size(max = 50, message = "El nombre no puede exceder los 50 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @Min(value = 1, message = "El nivel mínimo es 1")
    @Max(value = 100, message = "El nivel máximo es 100")
    @Column(name = "level", nullable = false)
    private Integer level;
    
    /**
     * Indica si la habilidad es destacada en el perfil del candidato.
     */
    @Builder.Default
    @Column(name = "destacada", nullable = false)
    private Boolean destacada = Boolean.TRUE;
} 