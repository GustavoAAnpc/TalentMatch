package com.talentmatch.model.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ForeignKey;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.BatchSize;
import jakarta.persistence.Transient;

/**
 * Entidad que representa una prueba técnica generada por IA en el sistema TalentMatch.
 */
@Entity
@Table(name = "pruebas_tecnicas",
       indexes = {
           @Index(name = "idx_pruebas_tecnicas_reclutador", columnList = "reclutador_id"),
           @Index(name = "idx_pruebas_tecnicas_completada", columnList = "completada"),
           @Index(name = "idx_pruebas_tecnicas_nivel", columnList = "nivel_dificultad"),
           @Index(name = "idx_pruebas_tecnicas_fecha", columnList = "fecha_creacion")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"preguntas", "postulacion"})
@EqualsAndHashCode(of = "id")
public class PruebaTecnica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postulacion_id", nullable = true, foreignKey = @ForeignKey(name = "fk_pruebas_tecnicas_postulaciones"))
    private Postulacion postulacion;

    @NotNull(message = "El reclutador es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclutador_id", nullable = false, foreignKey = @ForeignKey(name = "fk_pruebas_tecnicas_reclutadores"))
    private Reclutador reclutador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacante_id", foreignKey = @ForeignKey(name = "fk_pruebas_tecnicas_vacantes"))
    private Vacante vacante;

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 5, max = 100, message = "El título debe tener entre 5 y 100 caracteres")
    @Column(nullable = false)
    private String titulo;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(min = 20, message = "La descripción debe tener al menos 20 caracteres")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @NotBlank(message = "Las instrucciones son obligatorias")
    @Size(min = 20, message = "Las instrucciones deben tener al menos 20 caracteres")
    @Column(name = "instrucciones", columnDefinition = "TEXT", nullable = false)
    private String instrucciones;

    @Min(value = 15, message = "El tiempo límite debe ser al menos 15 minutos")
    @Max(value = 180, message = "El tiempo límite no puede exceder 180 minutos")
    @Column(name = "tiempo_limite_minutos")
    private Integer tiempoLimiteMinutos;

    @NotBlank(message = "El nivel de dificultad es obligatorio")
    @Pattern(regexp = "^(BASICO|INTERMEDIO|AVANZADO)$", message = "El nivel de dificultad debe ser BASICO, INTERMEDIO o AVANZADO")
    @Column(name = "nivel_dificultad", nullable = false, length = 20)
    private String nivelDificultad;

    @NotBlank(message = "Las tecnologías son obligatorias")
    @Size(max = 255, message = "Las tecnologías no pueden exceder los 255 caracteres")
    @Column(name = "tecnologias", nullable = false)
    private String tecnologias;

    @Column(name = "preguntas_texto", columnDefinition = "TEXT")
    private String preguntasTexto;

    @Column(name = "respuestas_texto", columnDefinition = "TEXT")
    private String respuestasTexto;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;

    @Column(name = "completada")
    private Boolean completada;

    @Min(value = 0, message = "La puntuación total debe ser mayor o igual a 0")
    @Max(value = 100, message = "La puntuación total debe ser menor o igual a 100")
    @Column(name = "puntuacion_total")
    private Integer puntuacionTotal;

    @OneToMany(mappedBy = "pruebaTecnica", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private Set<Pregunta> preguntas = new HashSet<>();

    @Transient
    private List<String> preguntasList;

    @Transient
    private List<String> respuestasList;

    /**
     * Método que se ejecuta antes de persistir la entidad.
     * Inicializa fechas y estado por defecto.
     */
    @PrePersist
    protected void onPrePersist() {
        fechaCreacion = LocalDateTime.now();
        if (completada == null) {
            completada = false;
        }
        if (preguntas == null) {
            preguntas = new HashSet<>();
        }
        
        // Convertir listas transientes a texto si están presentes
        if (preguntasList != null && !preguntasList.isEmpty()) {
            this.preguntasTexto = String.join("|||", preguntasList);
        }
        
        if (respuestasList != null && !respuestasList.isEmpty()) {
            this.respuestasTexto = String.join("|||", respuestasList);
        }
    }

    /**
     * Método que se ejecuta antes de actualizar la entidad.
     * Actualiza la fecha de actualización.
     */
    @PreUpdate
    protected void onPreUpdate() {
        fechaActualizacion = LocalDateTime.now();
        
        // Actualizar texto de preguntas y respuestas si las listas transientes están presentes
        if (preguntasList != null && !preguntasList.isEmpty()) {
            this.preguntasTexto = String.join("|||", preguntasList);
        }
        
        if (respuestasList != null && !respuestasList.isEmpty()) {
            this.respuestasTexto = String.join("|||", respuestasList);
        }
    }

    /**
     * Inicia la prueba técnica.
     */
    public void iniciar() {
        this.fechaInicio = LocalDateTime.now();
    }

    /**
     * Finaliza la prueba técnica.
     */
    public void finalizar() {
        this.fechaFinalizacion = LocalDateTime.now();
        this.completada = true;
    }

    /**
     * Calcula la puntuación total de la prueba técnica.
     * 
     * @return Puntuación total
     */
    public int calcularPuntuacionTotal() {
        int puntuacion = 0;
        for (Pregunta pregunta : preguntas) {
            if (pregunta.getPuntuacion() != null) {
                puntuacion += pregunta.getPuntuacion();
            }
        }
        this.puntuacionTotal = puntuacion;
        return puntuacion;
    }
    
    /**
     * Obtiene la lista de textos de preguntas.
     * 
     * @return Lista de textos de preguntas
     */
    public List<String> getPreguntasTexto() {
        if (this.preguntasList == null) {
            this.preguntasList = new ArrayList<>();
            if (this.preguntasTexto != null && !this.preguntasTexto.isEmpty()) {
                this.preguntasList = List.of(this.preguntasTexto.split("\\|\\|\\|"));
            }
        }
        return this.preguntasList;
    }
    
    /**
     * Establece la lista de preguntas.
     * 
     * @param preguntas Lista de textos de preguntas
     */
    public void setPreguntas(List<String> preguntas) {
        this.preguntasList = preguntas;
        if (preguntas != null && !preguntas.isEmpty()) {
            this.preguntasTexto = String.join("|||", preguntas);
        } else {
            this.preguntasTexto = null;
        }
    }
    
    /**
     * Obtiene la lista de respuestas.
     * 
     * @return Lista de textos de respuestas
     */
    public List<String> getRespuestas() {
        if (this.respuestasList == null) {
            this.respuestasList = new ArrayList<>();
            if (this.respuestasTexto != null && !this.respuestasTexto.isEmpty()) {
                this.respuestasList = List.of(this.respuestasTexto.split("\\|\\|\\|"));
            }
        }
        return this.respuestasList;
    }
    
    /**
     * Establece la lista de respuestas.
     * 
     * @param respuestas Lista de textos de respuestas
     */
    public void setRespuestas(List<String> respuestas) {
        this.respuestasList = respuestas;
        if (respuestas != null && !respuestas.isEmpty()) {
            this.respuestasTexto = String.join("|||", respuestas);
        } else {
            this.respuestasTexto = null;
        }
    }
}
