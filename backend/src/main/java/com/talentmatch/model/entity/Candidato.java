package com.talentmatch.model.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ForeignKey;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.Builder;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.BatchSize;
import jakarta.persistence.PrimaryKeyJoinColumn;

/**
 * Entidad que representa a un candidato en el sistema TalentMatch.
 * Extiende de la clase Usuario y añade información específica del candidato.
 */
@Entity
@Table(name = "candidatos",
       indexes = {
           @Index(name = "idx_candidatos_titulo", columnList = "titulo_profesional"),
           @Index(name = "idx_candidatos_experiencia", columnList = "experiencia_anios"),
           @Index(name = "idx_candidatos_disponibilidad", columnList = "disponibilidad_inmediata")
       })
@PrimaryKeyJoinColumn(name = "id", foreignKey = @ForeignKey(name = "fk_candidatos_usuarios"))
@Data
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@ToString(callSuper = true, exclude = {"postulaciones", "vacantesFavoritas", "experienciasLaborales", "educaciones", "habilidades", "certificaciones", "idiomas"})
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Candidato extends Usuario {

    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "url_curriculum")
    private String urlCurriculum;

    @Size(max = 100, message = "El título profesional no puede exceder los 100 caracteres")
    @Column(name = "titulo_profesional")
    private String tituloProfesional;

    @Size(max = 2000, message = "El resumen del perfil no puede exceder los 2000 caracteres")
    @Column(name = "resumen_perfil", columnDefinition = "TEXT")
    private String resumenPerfil;

    @Size(max = 100, message = "La ubicación no puede exceder los 100 caracteres")
    @Column(name = "ubicacion")
    private String ubicacion;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Size(max = 1000, message = "Las habilidades principales no pueden exceder los 1000 caracteres")
    @Column(name = "habilidades_principales", columnDefinition = "TEXT")
    private String habilidadesPrincipales;

    @Column(name = "experiencia_anios")
    private Integer experienciaAnios;

    @Column(name = "disponibilidad_inmediata")
    private Boolean disponibilidadInmediata;

    @Column(name = "autenticacion_oauth2")
    private Boolean autenticacionOAuth2;

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<ExperienciaLaboral> experienciasLaborales = new ArrayList<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<Educacion> educaciones = new ArrayList<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<Habilidad> habilidades = new ArrayList<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<Certificacion> certificaciones = new ArrayList<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<Idioma> idiomas = new ArrayList<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private Set<Postulacion> postulaciones = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "vacantes_favoritas",
        joinColumns = @JoinColumn(name = "candidato_id", foreignKey = @ForeignKey(name = "fk_favoritos_candidatos")),
        inverseJoinColumns = @JoinColumn(name = "vacante_id", foreignKey = @ForeignKey(name = "fk_favoritos_vacantes")),
        indexes = {
            @Index(name = "idx_favoritos_candidato", columnList = "candidato_id"),
            @Index(name = "idx_favoritos_vacante", columnList = "vacante_id")
        }
    )
    @Builder.Default
    @BatchSize(size = 20)
    private Set<Vacante> vacantesFavoritas = new HashSet<>();

    @OneToMany(mappedBy = "candidato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    private List<Documento> documentos = new ArrayList<>();

    /**
     * Añade una experiencia laboral manteniendo la relación bidireccional.
     * 
     * @param experiencia Experiencia laboral a añadir
     * @return La experiencia laboral añadida
     */
    public ExperienciaLaboral addExperienciaLaboral(ExperienciaLaboral experiencia) {
        experienciasLaborales.add(experiencia);
        experiencia.setCandidato(this);
        return experiencia;
    }

    /**
     * Elimina una experiencia laboral manteniendo la relación bidireccional.
     * 
     * @param experiencia Experiencia laboral a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeExperienciaLaboral(ExperienciaLaboral experiencia) {
        boolean removed = experienciasLaborales.remove(experiencia);
        if (removed) {
            experiencia.setCandidato(null);
        }
        return removed;
    }

    /**
     * Añade una postulación manteniendo la relación bidireccional.
     * 
     * @param postulacion Postulación a añadir
     * @return La postulación añadida
     */
    public Postulacion addPostulacion(Postulacion postulacion) {
        postulaciones.add(postulacion);
        postulacion.setCandidato(this);
        return postulacion;
    }

    /**
     * Elimina una postulación manteniendo la relación bidireccional.
     * 
     * @param postulacion Postulación a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removePostulacion(Postulacion postulacion) {
        boolean removed = postulaciones.remove(postulacion);
        if (removed) {
            postulacion.setCandidato(null);
        }
        return removed;
    }

    /**
     * Añade una vacante a favoritos.
     * 
     * @param vacante Vacante a añadir a favoritos
     * @return true si se añadió correctamente, false si ya estaba en favoritos
     */
    public boolean agregarVacanteFavorita(Vacante vacante) {
        boolean added = this.vacantesFavoritas.add(vacante);
        if (added) {
            vacante.getCandidatosFavoritos().add(this);
        }
        return added;
    }

    /**
     * Elimina una vacante de favoritos.
     * 
     * @param vacante Vacante a eliminar de favoritos
     * @return true si se eliminó correctamente, false si no estaba en favoritos
     */
    public boolean eliminarVacanteFavorita(Vacante vacante) {
        boolean removed = this.vacantesFavoritas.remove(vacante);
        if (removed) {
            vacante.getCandidatosFavoritos().remove(this);
        }
        return removed;
    }

    /**
     * Verifica si una vacante está en favoritos.
     * 
     * @param vacante Vacante a verificar
     * @return true si la vacante está en favoritos, false en caso contrario
     */
    public boolean esVacanteFavorita(Vacante vacante) {
        return this.vacantesFavoritas.contains(vacante);
    }

    /**
     * Añade una educación manteniendo la relación bidireccional.
     * 
     * @param educacion Educación a añadir
     * @return La educación añadida
     */
    public Educacion addEducacion(Educacion educacion) {
        educaciones.add(educacion);
        educacion.setCandidato(this);
        return educacion;
    }

    /**
     * Elimina una educación manteniendo la relación bidireccional.
     * 
     * @param educacion Educación a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeEducacion(Educacion educacion) {
        boolean removed = educaciones.remove(educacion);
        if (removed) {
            educacion.setCandidato(null);
        }
        return removed;
    }
    
    /**
     * Añade una habilidad manteniendo la relación bidireccional.
     * 
     * @param habilidad Habilidad a añadir
     * @return La habilidad añadida
     */
    public Habilidad addHabilidad(Habilidad habilidad) {
        habilidades.add(habilidad);
        habilidad.setCandidato(this);
        return habilidad;
    }

    /**
     * Elimina una habilidad manteniendo la relación bidireccional.
     * 
     * @param habilidad Habilidad a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeHabilidad(Habilidad habilidad) {
        boolean removed = habilidades.remove(habilidad);
        if (removed) {
            habilidad.setCandidato(null);
        }
        return removed;
    }
    
    /**
     * Añade una certificación manteniendo la relación bidireccional.
     * 
     * @param certificacion Certificación a añadir
     * @return La certificación añadida
     */
    public Certificacion addCertificacion(Certificacion certificacion) {
        certificaciones.add(certificacion);
        certificacion.setCandidato(this);
        return certificacion;
    }

    /**
     * Elimina una certificación manteniendo la relación bidireccional.
     * 
     * @param certificacion Certificación a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeCertificacion(Certificacion certificacion) {
        boolean removed = certificaciones.remove(certificacion);
        if (removed) {
            certificacion.setCandidato(null);
        }
        return removed;
    }
    
    /**
     * Añade un idioma manteniendo la relación bidireccional.
     * 
     * @param idioma Idioma a añadir
     * @return El idioma añadido
     */
    public Idioma addIdioma(Idioma idioma) {
        idiomas.add(idioma);
        idioma.setCandidato(this);
        return idioma;
    }

    /**
     * Elimina un idioma manteniendo la relación bidireccional.
     * 
     * @param idioma Idioma a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeIdioma(Idioma idioma) {
        boolean removed = idiomas.remove(idioma);
        if (removed) {
            idioma.setCandidato(null);
        }
        return removed;
    }

    /**
     * Añade un documento manteniendo la relación bidireccional.
     * 
     * @param documento Documento a añadir
     * @return El documento añadido
     */
    public Documento addDocumento(Documento documento) {
        documentos.add(documento);
        documento.setCandidato(this);
        return documento;
    }

    /**
     * Elimina un documento manteniendo la relación bidireccional.
     * 
     * @param documento Documento a eliminar
     * @return true si se eliminó correctamente, false en caso contrario
     */
    public boolean removeDocumento(Documento documento) {
        boolean removed = documentos.remove(documento);
        if (removed) {
            documento.setCandidato(null);
        }
        return removed;
    }

    /**
     * Obtiene el documento principal (CV) del candidato.
     * 
     * @return El documento principal o null si no existe
     */
    public Documento getDocumentoPrincipal() {
        return documentos.stream()
                .filter(doc -> Boolean.TRUE.equals(doc.getEsPrincipal()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Establece un documento como principal y actualiza el urlCurriculum.
     * 
     * @param documento Documento a establecer como principal
     */
    public void setDocumentoPrincipal(Documento documento) {
        // Quitar la marca de principal de todos los documentos
        documentos.forEach(doc -> doc.setEsPrincipal(false));
        
        // Establecer el nuevo documento como principal
        if (documento != null && documentos.contains(documento)) {
            documento.setEsPrincipal(true);
            this.urlCurriculum = documento.getUrl();
        } else {
            this.urlCurriculum = null;
        }
    }

    /**
     * Método que se ejecuta antes de persistir la entidad.
     * Asegura que las colecciones estén inicializadas.
     */
    @PrePersist
    protected void onPrePersist() {
        if (postulaciones == null) {
            postulaciones = new HashSet<>();
        }
        if (vacantesFavoritas == null) {
            vacantesFavoritas = new HashSet<>();
        }
        if (experienciasLaborales == null) {
            experienciasLaborales = new ArrayList<>();
        }
        if (educaciones == null) {
            educaciones = new ArrayList<>();
        }
        if (habilidades == null) {
            habilidades = new ArrayList<>();
        }
        if (certificaciones == null) {
            certificaciones = new ArrayList<>();
        }
        if (idiomas == null) {
            idiomas = new ArrayList<>();
        }
        if (documentos == null) {
            documentos = new ArrayList<>();
        }
    }
}
