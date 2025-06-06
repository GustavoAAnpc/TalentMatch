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
 * Entidad que representa una certificación profesional de un candidato.
 */
@Entity
@Table(name = "certificaciones",
       indexes = {
           @Index(name = "idx_certificaciones_candidato", columnList = "candidato_id"),
           @Index(name = "idx_certificaciones_name", columnList = "name")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"candidato"})
public class Certificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_certificaciones_candidatos"))
    private Candidato candidato;

    @NotBlank(message = "El nombre de la certificación es requerido")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @NotBlank(message = "La entidad emisora es requerida")
    @Size(max = 100, message = "La entidad emisora no puede exceder los 100 caracteres")
    @Column(name = "issuer", nullable = false)
    private String issuer;

    @Column(name = "date")
    private LocalDate date;

    @Size(max = 100, message = "La fecha de expiración/validez no puede exceder los 100 caracteres")
    @Column(name = "expiration")
    private String expiration;
} 