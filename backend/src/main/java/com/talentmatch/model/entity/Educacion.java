package com.talentmatch.model.entity;

import java.time.LocalDate;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entidad que representa la información educativa de un candidato.
 */
@Entity
@Table(name = "educacion",
       indexes = {
           @Index(name = "idx_educacion_candidato", columnList = "candidato_id"),
           @Index(name = "idx_educacion_institution", columnList = "institution")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"candidato"})
public class Educacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_educacion_candidatos"))
    private Candidato candidato;

    @NotBlank(message = "El grado o título es requerido")
    @Size(max = 100, message = "El grado no puede exceder los 100 caracteres")
    @Column(name = "degree", nullable = false)
    private String degree;

    @NotBlank(message = "La institución educativa es requerida")
    @Size(max = 100, message = "La institución no puede exceder los 100 caracteres")
    @Column(name = "institution", nullable = false)
    private String institution;

    @Size(max = 100, message = "La ubicación no puede exceder los 100 caracteres")
    @Column(name = "location")
    private String location;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Size(max = 500, message = "La descripción no puede exceder los 500 caracteres")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
} 