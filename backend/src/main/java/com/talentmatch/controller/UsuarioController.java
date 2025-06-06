package com.talentmatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.talentmatch.dto.response.UsuarioResponse;
import com.talentmatch.mapper.UsuarioMapper;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.repository.UsuarioRepository;
import com.talentmatch.service.UsuarioService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final UsuarioService usuarioService;
    
    /**
     * Obtener usuario por ID.
     * 
     * @param id ID del usuario
     * @return Datos del usuario encontrado
     */
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerUsuarioPorId(@PathVariable Long id) {
        log.info("Obteniendo usuario con ID: {}", id);
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    log.info("Usuario encontrado: {}", usuario.getEmail());
                    return ResponseEntity.ok(usuarioMapper.toUsuarioResponse(usuario));
                })
                .orElseGet(() -> {
                    log.error("Usuario con ID {} no encontrado", id);
                    return ResponseEntity.notFound().build();
                });
    }
    
    /**
     * Obtener el perfil del usuario autenticado.
     * 
     * @param usuario Usuario autenticado (inyectado por SecurityContext)
     * @return Datos del usuario autenticado
     */
    @GetMapping("/perfil")
    public ResponseEntity<UsuarioResponse> obtenerPerfilUsuario(Usuario usuario) {
        log.info("Obteniendo perfil del usuario autenticado: {}", usuario.getEmail());
        return ResponseEntity.ok(usuarioMapper.toUsuarioResponse(usuario));
    }
    
    /**
     * Actualiza la foto de perfil del usuario.
     * 
     * @param id ID del usuario
     * @param foto Archivo de imagen para la foto de perfil
     * @return URL de la foto actualizada
     */
    @PostMapping("/{id}/foto-perfil")
    @PreAuthorize("authentication.principal.id == #id")
    public ResponseEntity<String> actualizarFotoPerfil(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile foto) {
        log.info("Actualizando foto de perfil para usuario con ID: {}", id);
        try {
            // Validar tamaño del archivo
            if (foto.getSize() > 2 * 1024 * 1024) { // Limitar a 2MB
                return ResponseEntity.badRequest()
                    .body("La imagen es demasiado grande. El tamaño máximo permitido es 2MB.");
            }
            
            // Validar tipo de archivo
            String contentType = foto.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body("El archivo debe ser una imagen (JPEG, PNG, etc.)");
            }
            
            String urlFoto = usuarioService.actualizarFotoPerfil(id, foto);
            return ResponseEntity.ok(urlFoto);
        } catch (Exception e) {
            log.error("Error al actualizar foto de perfil: {}", e.getMessage(), e);
            
            // Devolver un mensaje de error más genérico al cliente
            String mensajeError = "Error al actualizar foto de perfil. Por favor, inténtalo de nuevo.";
            
            // Si es un error conocido, proporcionar más detalles
            if (e.getMessage() != null && e.getMessage().contains("too long for column")) {
                mensajeError = "Error al actualizar foto de perfil: La URL de la imagen es demasiado larga.";
            }
            
            return ResponseEntity.badRequest().body(mensajeError);
        }
    }
    
    /**
     * Elimina la foto de perfil del usuario y restaura la foto por defecto.
     * 
     * @param id ID del usuario
     * @return URL de la foto de perfil por defecto
     */
    @DeleteMapping("/{id}/foto-perfil")
    @PreAuthorize("authentication.principal.id == #id")
    public ResponseEntity<String> eliminarFotoPerfil(@PathVariable Long id) {
        log.info("Eliminando foto de perfil para usuario con ID: {}", id);
        try {
            String urlFotoDefault = usuarioService.eliminarFotoPerfil(id);
            return ResponseEntity.ok(urlFotoDefault);
        } catch (Exception e) {
            log.error("Error al eliminar foto de perfil: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error al eliminar foto de perfil: " + e.getMessage());
        }
    }
} 