package com.talentmatch.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.ActualizacionCandidatoRequest;
import com.talentmatch.dto.request.RegistroCandidatoRequest;
import com.talentmatch.dto.response.CandidatoResponse;
import com.talentmatch.dto.response.PaginaResponse;
import com.talentmatch.service.CandidatoService;
import com.talentmatch.service.CertificacionService;
import com.talentmatch.service.EducacionService;
import com.talentmatch.service.ExperienciaLaboralService;
import com.talentmatch.service.HabilidadService;
import com.talentmatch.service.IdiomaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la gestión de candidatos.
 */
@RestController
@RequestMapping("/api/candidatos")
@RequiredArgsConstructor
@Slf4j
public class CandidatoController {

    private final CandidatoService candidatoService;
    private final EducacionService educacionService;
    private final HabilidadService habilidadService;
    private final CertificacionService certificacionService;
    private final IdiomaService idiomaService;
    private final ExperienciaLaboralService experienciaLaboralService;

    /**
     * Registra un nuevo candidato.
     * 
     * @param request DTO con la información del candidato a registrar
     * @return ResponseEntity con el DTO del candidato registrado
     */
    @PostMapping
    public ResponseEntity<CandidatoResponse> registrarCandidato(@Valid @RequestBody RegistroCandidatoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidatoService.registrar(request));
    }

    /**
     * Obtiene un candidato por su ID.
     * 
     * @param id ID del candidato a buscar
     * @return ResponseEntity con el DTO del candidato
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<CandidatoResponse> obtenerCandidatoPorId(@PathVariable Long id) {
        return ResponseEntity.ok(candidatoService.buscarPorId(id));
    }

    /**
     * Actualiza la información de un candidato.
     * 
     * @param id ID del candidato a actualizar
     * @param request DTO con la información actualizada
     * @return ResponseEntity con el DTO del candidato actualizado
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<?> actualizarCandidato(
            @PathVariable Long id,
            @Valid @RequestBody ActualizacionCandidatoRequest request) {
        try {
            CandidatoResponse candidatoActualizado = candidatoService.actualizar(id, request);
            return ResponseEntity.ok(candidatoActualizado);
        } catch (Exception e) {
            // Loguear el error para depuración
            log.error("Error al actualizar candidato con ID {}: {}", id, e.getMessage(), e);
            
            // Crear respuesta de error
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("mensaje", "Error al actualizar el candidato: " + e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now().toString());
            errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Sube el currículum de un candidato.
     * 
     * @param id ID del candidato
     * @param curriculum Archivo de currículum
     * @return ResponseEntity con la URL del currículum subido
     */
    @PostMapping("/{id}/curriculum")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> subirCurriculum(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile curriculum) {
        return ResponseEntity.ok(candidatoService.subirCurriculum(id, curriculum));
    }

    /**
     * Agrega una vacante a favoritos.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado de la operación
     */
    @PostMapping("/{candidatoId}/favoritos/{vacanteId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Boolean> agregarVacanteFavorita(
            @PathVariable Long candidatoId,
            @PathVariable Long vacanteId) {
        return ResponseEntity.ok(candidatoService.agregarVacanteFavorita(candidatoId, vacanteId));
    }

    /**
     * Elimina una vacante de favoritos.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado de la operación
     */
    @DeleteMapping("/{candidatoId}/favoritos/{vacanteId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Boolean> eliminarVacanteFavorita(
            @PathVariable Long candidatoId,
            @PathVariable Long vacanteId) {
        return ResponseEntity.ok(candidatoService.eliminarVacanteFavorita(candidatoId, vacanteId));
    }

    /**
     * Obtiene todas las vacantes favoritas de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de vacantes favoritas
     */
    @GetMapping("/{candidatoId}/vacantes-favoritas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<List<com.talentmatch.dto.response.VacanteResumenResponse>> obtenerVacantasFavoritas(
            @PathVariable Long candidatoId) {
        return ResponseEntity.ok(candidatoService.obtenerVacantasFavoritas(candidatoId));
    }

    /**
     * Verifica si una vacante está en favoritos.
     * 
     * @param candidatoId ID del candidato
     * @param vacanteId ID de la vacante
     * @return ResponseEntity con el resultado de la verificación
     */
    @GetMapping("/{candidatoId}/favoritos/{vacanteId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Boolean> esVacanteFavorita(
            @PathVariable Long candidatoId,
            @PathVariable Long vacanteId) {
        return ResponseEntity.ok(candidatoService.esVacanteFavorita(candidatoId, vacanteId));
    }

    /**
     * Busca candidatos por título profesional con paginación.
     * 
     * @param tituloProfesional Título profesional a buscar
     * @param pagina Número de página (0-based)
     * @param tamanio Tamaño de la página
     * @return ResponseEntity con la página de candidatos
     */
    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<PaginaResponse<CandidatoResponse>> buscarPorTituloProfesional(
            @RequestParam String tituloProfesional,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio) {
        
        Pageable pageable = PageRequest.of(pagina, tamanio, Sort.by("id").descending());
        Page<CandidatoResponse> paginaCandidatos = candidatoService.buscarPorTituloProfesional(tituloProfesional, pageable);
        
        PaginaResponse<CandidatoResponse> respuesta = new PaginaResponse<>(
                paginaCandidatos.getContent(),
                paginaCandidatos.getNumber(),
                paginaCandidatos.getSize(),
                paginaCandidatos.getTotalElements(),
                paginaCandidatos.getTotalPages(),
                paginaCandidatos.isFirst(),
                paginaCandidatos.isLast());
        
        return ResponseEntity.ok(respuesta);
    }

    /**
     * Lista todos los candidatos activos.
     * 
     * @return ResponseEntity con la lista de DTOs de candidatos
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<List<CandidatoResponse>> listarCandidatos() {
        return ResponseEntity.ok(candidatoService.listarTodos());
    }

    /**
     * Busca candidatos con filtros avanzados para reclutadores.
     * 
     * @param tituloProfesional Filtro por título profesional (opcional)
     * @param nombre Filtro por nombre del candidato (opcional)
     * @param habilidad Filtro por habilidad (opcional)
     * @param experienciaMinima Filtro por años mínimos de experiencia (opcional)
     * @param ubicacion Filtro por ubicación (opcional)
     * @param disponibilidadInmediata Filtro por disponibilidad inmediata (opcional)
     * @param pagina Número de página (0-based)
     * @param tamanio Tamaño de la página
     * @param ordenarPor Campo por el que ordenar los resultados
     * @param direccion Dirección de ordenamiento (asc o desc)
     * @return ResponseEntity con la página de candidatos filtrados
     */
    @GetMapping("/filtrar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<PaginaResponse<CandidatoResponse>> filtrarCandidatos(
            @RequestParam(required = false) String tituloProfesional,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String habilidad,
            @RequestParam(required = false) Integer experienciaMinima,
            @RequestParam(required = false) String ubicacion,
            @RequestParam(required = false) Boolean disponibilidadInmediata,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio,
            @RequestParam(defaultValue = "id") String ordenarPor,
            @RequestParam(defaultValue = "desc") String direccion) {
        
        Sort.Direction dir = direccion.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pagina, tamanio, Sort.by(dir, ordenarPor));
        
        Page<CandidatoResponse> paginaCandidatos = candidatoService.filtrarCandidatos(
                tituloProfesional, nombre, habilidad, experienciaMinima, ubicacion, disponibilidadInmediata, pageable);
        
        PaginaResponse<CandidatoResponse> respuesta = new PaginaResponse<>(
                paginaCandidatos.getContent(),
                paginaCandidatos.getNumber(),
                paginaCandidatos.getSize(),
                paginaCandidatos.getTotalElements(),
                paginaCandidatos.getTotalPages(),
                paginaCandidatos.isFirst(),
                paginaCandidatos.isLast());
        
        return ResponseEntity.ok(respuesta);
    }

    /**
     * Obtiene la experiencia laboral de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de experiencias laborales
     */
    @GetMapping("/{candidatoId}/experiencia")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerExperienciaLaboral(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(experienciaLaboralService.listarPorCandidato(candidatoId));
    }
    
    /**
     * Crea o actualiza experiencia laboral para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param request Datos de la experiencia laboral
     * @return ResponseEntity con la experiencia laboral creada o actualizada
     */
    @PostMapping("/{candidatoId}/experiencia")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> guardarExperienciaLaboral(
            @PathVariable Long candidatoId,
            @RequestBody Map<String, Object> request) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(experienciaLaboralService.crear(candidatoId, request));
    }
    
    /**
     * Actualiza una experiencia laboral existente.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @param request Datos actualizados de la experiencia laboral
     * @return ResponseEntity con la experiencia laboral actualizada
     */
    @PutMapping("/{candidatoId}/experiencia/{experienciaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarExperienciaLaboral(
            @PathVariable Long candidatoId,
            @PathVariable Long experienciaId,
            @RequestBody Map<String, Object> request) {
        
        return ResponseEntity.ok(experienciaLaboralService.actualizar(candidatoId, experienciaId, request));
    }
    
    /**
     * Elimina una experiencia laboral.
     * 
     * @param candidatoId ID del candidato
     * @param experienciaId ID de la experiencia laboral
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{candidatoId}/experiencia/{experienciaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarExperienciaLaboral(
            @PathVariable Long candidatoId,
            @PathVariable Long experienciaId) {
        
        experienciaLaboralService.eliminar(candidatoId, experienciaId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener educación del candidato.
     * 
     * @param candidatoId ID del candidato
     * @return Lista de educaciones del candidato
     */
    @GetMapping("/{candidatoId}/educacion")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerEducacion(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(educacionService.listarPorCandidato(candidatoId));
    }
    
    /**
     * Guardar educación para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param educacion Datos de la educación
     * @return ResponseEntity con la educación guardada
     */
    @PostMapping("/{candidatoId}/educacion")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> guardarEducacion(
            @PathVariable Long candidatoId,
            @RequestBody Map<String, Object> educacion) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(educacionService.crear(candidatoId, educacion));
    }
    
    /**
     * Actualizar una educación existente.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     * @param educacion Datos actualizados de la educación
     * @return ResponseEntity con la educación actualizada
     */
    @PutMapping("/{candidatoId}/educacion/{educacionId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarEducacion(
            @PathVariable Long candidatoId,
            @PathVariable Long educacionId,
            @RequestBody Map<String, Object> educacion) {
        
        return ResponseEntity.ok(educacionService.actualizar(candidatoId, educacionId, educacion));
    }
    
    /**
     * Eliminar educación.
     * 
     * @param candidatoId ID del candidato
     * @param educacionId ID de la educación
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{candidatoId}/educacion/{educacionId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarEducacion(
            @PathVariable Long candidatoId,
            @PathVariable Long educacionId) {
        educacionService.eliminar(candidatoId, educacionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene las habilidades de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de habilidades
     */
    @GetMapping("/{candidatoId}/habilidades")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerHabilidades(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(habilidadService.listarPorCandidato(candidatoId));
    }
    
    /**
     * Obtiene las certificaciones de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de certificaciones
     */
    @GetMapping("/{candidatoId}/certificaciones")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerCertificaciones(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(certificacionService.listarPorCandidato(candidatoId));
    }
    
    /**
     * Obtiene los idiomas de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la lista de idiomas
     */
    @GetMapping("/{candidatoId}/idiomas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<Map<String, Object>>> obtenerIdiomas(@PathVariable Long candidatoId) {
        return ResponseEntity.ok(idiomaService.listarPorCandidato(candidatoId));
    }

    /**
     * Guardar una habilidad para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param habilidad Datos de la habilidad
     * @return ResponseEntity con la habilidad guardada
     */
    @PostMapping("/{candidatoId}/habilidades")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> guardarHabilidad(
            @PathVariable Long candidatoId,
            @RequestBody Map<String, Object> habilidad) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(habilidadService.crear(candidatoId, habilidad));
    }
    
    /**
     * Actualizar una habilidad existente.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     * @param habilidad Datos actualizados de la habilidad
     * @return ResponseEntity con la habilidad actualizada
     */
    @PutMapping("/{candidatoId}/habilidades/{habilidadId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarHabilidad(
            @PathVariable Long candidatoId,
            @PathVariable Long habilidadId,
            @RequestBody Map<String, Object> habilidad) {
        
        return ResponseEntity.ok(habilidadService.actualizar(candidatoId, habilidadId, habilidad));
    }
    
    /**
     * Eliminar una habilidad.
     * 
     * @param candidatoId ID del candidato
     * @param habilidadId ID de la habilidad
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{candidatoId}/habilidades/{habilidadId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarHabilidad(
            @PathVariable Long candidatoId,
            @PathVariable Long habilidadId) {
        habilidadService.eliminar(candidatoId, habilidadId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Guardar certificación para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param certificacion Datos de la certificación
     * @return ResponseEntity con la certificación guardada
     */
    @PostMapping("/{candidatoId}/certificaciones")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> guardarCertificacion(
            @PathVariable Long candidatoId,
            @RequestBody Map<String, Object> certificacion) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(certificacionService.crear(candidatoId, certificacion));
    }
    
    /**
     * Actualizar una certificación existente.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     * @param certificacion Datos actualizados de la certificación
     * @return ResponseEntity con la certificación actualizada
     */
    @PutMapping("/{candidatoId}/certificaciones/{certificacionId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarCertificacion(
            @PathVariable Long candidatoId,
            @PathVariable Long certificacionId,
            @RequestBody Map<String, Object> certificacion) {
        
        return ResponseEntity.ok(certificacionService.actualizar(candidatoId, certificacionId, certificacion));
    }
    
    /**
     * Eliminar una certificación.
     * 
     * @param candidatoId ID del candidato
     * @param certificacionId ID de la certificación
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{candidatoId}/certificaciones/{certificacionId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarCertificacion(
            @PathVariable Long candidatoId,
            @PathVariable Long certificacionId) {
        certificacionService.eliminar(candidatoId, certificacionId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Guardar idioma para un candidato.
     * 
     * @param candidatoId ID del candidato
     * @param idioma Datos del idioma
     * @return ResponseEntity con el idioma guardado
     */
    @PostMapping("/{candidatoId}/idiomas")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> guardarIdioma(
            @PathVariable Long candidatoId,
            @RequestBody Map<String, Object> idioma) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(idiomaService.crear(candidatoId, idioma));
    }
    
    /**
     * Actualizar un idioma existente.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     * @param idioma Datos actualizados del idioma
     * @return ResponseEntity con el idioma actualizado
     */
    @PutMapping("/{candidatoId}/idiomas/{idiomaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Map<String, Object>> actualizarIdioma(
            @PathVariable Long candidatoId,
            @PathVariable Long idiomaId,
            @RequestBody Map<String, Object> idioma) {
        
        return ResponseEntity.ok(idiomaService.actualizar(candidatoId, idiomaId, idioma));
    }
    
    /**
     * Eliminar un idioma.
     * 
     * @param candidatoId ID del candidato
     * @param idiomaId ID del idioma
     * @return ResponseEntity sin contenido
     */
    @DeleteMapping("/{candidatoId}/idiomas/{idiomaId}")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<Void> eliminarIdioma(
            @PathVariable Long candidatoId,
            @PathVariable Long idiomaId) {
        idiomaService.eliminar(candidatoId, idiomaId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Obtiene una URL firmada temporal para visualizar el currículum de un candidato.
     * 
     * @param candidatoId ID del candidato
     * @return ResponseEntity con la URL firmada temporal
     */
    @GetMapping("/{candidatoId}/curriculum/view")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<Map<String, String>> obtenerUrlCurriculumTemporal(@PathVariable Long candidatoId) {
        Map<String, String> response = new HashMap<>();
        response.put("url", candidatoService.generarUrlTemporalCurriculum(candidatoId));
        return ResponseEntity.ok(response);
    }
    
    /**
     * Actualiza la foto de perfil de un candidato.
     * 
     * @param id ID del candidato
     * @param fotoPerfil Archivo de foto de perfil
     * @return ResponseEntity con la URL de la foto de perfil subida
     */
    @PostMapping("/{id}/foto-perfil")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> actualizarFotoPerfil(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile fotoPerfil) {
        return ResponseEntity.ok(candidatoService.actualizarFotoPerfil(id, fotoPerfil));
    }
    
    /**
     * Elimina la foto de perfil de un candidato y restaura la foto por defecto.
     * 
     * @param id ID del candidato
     * @return ResponseEntity con la URL de la foto de perfil por defecto
     */
    @DeleteMapping("/{id}/foto-perfil")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #id or hasRole('ADMINISTRADOR'))")
    public ResponseEntity<String> eliminarFotoPerfil(
            @PathVariable Long id) {
        return ResponseEntity.ok(candidatoService.eliminarFotoPerfil(id));
    }
    
    /**
     * Actualiza el estado de un candidato.
     * 
     * @param id ID del candidato
     * @param request DTO con el nuevo estado
     * @return ResponseEntity con el DTO del candidato actualizado
     */
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<CandidatoResponse> actualizarEstadoCandidato(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        String nuevoEstado = request.get("estado");
        if (nuevoEstado == null || nuevoEstado.isEmpty()) {
            throw new IllegalArgumentException("El estado no puede estar vacío");
        }
        
        return ResponseEntity.ok(candidatoService.actualizarEstado(id, nuevoEstado));
    }
}