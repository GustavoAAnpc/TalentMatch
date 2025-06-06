package com.talentmatch.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ForeignKey;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Entidad que representa una evaluación de respuesta generada por IA en el sistema TalentMatch.
 */
@Entity
@Table(name = "evaluaciones",
       indexes = {
           @Index(name = "idx_evaluaciones_respuesta", columnList = "respuesta_id"),
           @Index(name = "idx_evaluaciones_prueba_tecnica", columnList = "prueba_tecnica_id"),
           @Index(name = "idx_evaluaciones_fecha", columnList = "fecha_creacion"),
           @Index(name = "idx_evaluaciones_puntuacion", columnList = "puntuacion")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"respuesta", "pruebaTecnica"})
@EqualsAndHashCode(of = "id")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respuesta_id", nullable = false, foreignKey = @ForeignKey(name = "fk_evaluaciones_respuestas"))
    private Respuesta respuesta;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prueba_tecnica_id", foreignKey = @ForeignKey(name = "fk_evaluaciones_pruebas_tecnicas"))
    private PruebaTecnica pruebaTecnica;

    @Column(name = "puntuacion", nullable = false)
    private Integer puntuacion;

    @Column(name = "puntos_fuertes", columnDefinition = "TEXT")
    private String puntosFuertes;

    @Column(name = "puntos_mejora", columnDefinition = "TEXT")
    private String puntosMejora;

    @Column(name = "retroalimentacion", columnDefinition = "TEXT", nullable = false)
    private String retroalimentacion;
    
    @Column(name = "comentarios", columnDefinition = "TEXT")
    private String comentarios;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_evaluacion")
    private LocalDateTime fechaEvaluacion;
    
    @Column(name = "evaluador", length = 100)
    private String evaluador;

    @Column(name = "generada_por_ia", nullable = false)
    private Boolean generadaPorIA;

    /**
     * Método que se ejecuta antes de persistir la entidad.
     * Inicializa la fecha de creación y valores por defecto.
     */
    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.generadaPorIA == null) {
            this.generadaPorIA = true;
        }
    }
    
    /**
     * Establece la prueba técnica asociada a esta evaluación.
     * 
     * @param pruebaTecnica Prueba técnica a establecer
     */
    public void setPruebaTecnica(PruebaTecnica pruebaTecnica) {
        this.pruebaTecnica = pruebaTecnica;
    }
    
    /**
     * Establece la fecha de evaluación.
     * 
     * @param fechaEvaluacion Fecha de evaluación
     */
    public void setFechaEvaluacion(LocalDateTime fechaEvaluacion) {
        this.fechaEvaluacion = fechaEvaluacion;
    }
    
    /**
     * Establece el evaluador.
     * 
     * @param evaluador Nombre o identificador del evaluador
     */
    public void setEvaluador(String evaluador) {
        this.evaluador = evaluador;
    }
    
    /**
     * Establece los comentarios de la evaluación.
     * 
     * @param comentarios Comentarios de la evaluación
     */
    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
        // Para compatibilidad, también actualizamos la retroalimentación si está vacía
        if (this.retroalimentacion == null || this.retroalimentacion.isEmpty()) {
            this.retroalimentacion = comentarios;
        }
    }
}
