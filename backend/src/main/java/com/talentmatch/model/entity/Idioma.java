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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entidad que representa un idioma que maneja un candidato.
 */
@Entity
@Table(name = "idiomas",
       indexes = {
           @Index(name = "idx_idiomas_candidato", columnList = "candidato_id"),
           @Index(name = "idx_idiomas_name", columnList = "name")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_candidato_idioma", columnNames = {"candidato_id", "name"})
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"candidato"})
public class Idioma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_idiomas_candidatos"))
    private Candidato candidato;

    @NotBlank(message = "El nombre del idioma es requerido")
    @Size(max = 50, message = "El nombre no puede exceder los 50 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @NotBlank(message = "El nivel de dominio es requerido")
    @Size(max = 20, message = "El nivel no puede exceder los 20 caracteres")
    @Column(name = "level", nullable = false)
    private String level;
} 