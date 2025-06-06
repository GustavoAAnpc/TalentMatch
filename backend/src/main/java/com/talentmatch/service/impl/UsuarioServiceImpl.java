package com.talentmatch.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import com.talentmatch.dto.request.CambioPasswordRequest;
import com.talentmatch.dto.response.UsuarioResponse;
import com.talentmatch.exception.AutenticacionException;
import com.talentmatch.exception.OperacionInvalidaException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.mapper.UsuarioMapper;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.model.enums.EstadoUsuario;
import com.talentmatch.repository.UsuarioRepository;
import com.talentmatch.service.StorageService;
import com.talentmatch.service.UsuarioService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de usuarios.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        return usuarioMapper.toUsuarioResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con email: " + email));
        
        return usuarioMapper.toUsuarioResponse(usuario);
    }

    @Override
    @Transactional
    public void cambiarPassword(Long id, CambioPasswordRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        if (!passwordEncoder.matches(request.getPasswordActual(), usuario.getPassword())) {
            throw new AutenticacionException("La contraseña actual es incorrecta");
        }
        
        usuario.setPassword(passwordEncoder.encode(request.getNuevaPassword()));
        usuarioRepository.save(usuario);
        
        log.info("Contraseña actualizada exitosamente para el usuario ID: {}", id);
    }

    @Override
    @Transactional
    public String actualizarFotoPerfil(Long id, MultipartFile foto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        // Validar tipo de archivo
        String contentType = foto.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new OperacionInvalidaException("El archivo debe ser una imagen (JPEG, PNG, etc.)");
        }
        
        // Comprobar tamaño del archivo (máximo 5MB)
        if (foto.getSize() > 5 * 1024 * 1024) {
            throw new OperacionInvalidaException("La imagen no debe superar los 5MB");
        }
        
        // Verificar proveedor de imagen actual
        String urlFotoOriginal = usuario.getUrlFoto();
        String proveedorImagen = detectarProveedorImagen(urlFotoOriginal);
        
        log.info("Actualizando foto de perfil. URL original: {}, Proveedor: {}", urlFotoOriginal, proveedorImagen);
        
        // Eliminar foto anterior si existe y es de nuestro servicio (firebase)
        if (urlFotoOriginal != null && "firebase".equals(proveedorImagen)) {
            try {
                // Limpiar URL para eliminar parámetros de consulta
                String urlLimpia = urlFotoOriginal;
                if (urlFotoOriginal.contains("?")) {
                    urlLimpia = urlFotoOriginal.split("\\?")[0];
                }
                
                storageService.eliminarArchivo(urlLimpia);
                log.info("Foto anterior eliminada correctamente: {}", urlLimpia);
            } catch (Exception e) {
                log.warn("No se pudo eliminar la foto anterior: {}", e.getMessage());
                // Continuamos con el proceso aunque falle la eliminación
            }
        }
        
        // Guardar nueva foto
        String extension = obtenerExtensionArchivo(foto.getOriginalFilename());
        String ruta = "fotos_perfil/usuarios/" + id;
        String archivoNombre = System.currentTimeMillis() + extension;
        
        String url = storageService.guardarArchivo(foto, ruta, archivoNombre);
        
        // Actualizar URL en el usuario
        usuario.setUrlFoto(url);
        usuarioRepository.save(usuario);
        
        log.info("Foto de perfil actualizada para el usuario ID: {}", id);
        
        return url;
    }
    
    /**
     * Obtiene la extensión de un archivo.
     * 
     * @param nombreArchivo Nombre del archivo
     * @return Extensión del archivo con el punto incluido
     */
    private String obtenerExtensionArchivo(String nombreArchivo) {
        if (nombreArchivo == null || nombreArchivo.isEmpty()) {
            return ".jpg"; // Extensión por defecto
        }
        
        int indicePunto = nombreArchivo.lastIndexOf(".");
        if (indicePunto > 0) {
            return nombreArchivo.substring(indicePunto);
        }
        
        return ".jpg"; // Extensión por defecto
    }

    @Override
    @Transactional
    public String eliminarFotoPerfil(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        // Guardar el estado original de la URL de la foto para verificación
        String urlFotoOriginal = usuario.getUrlFoto();
        String proveedorImagen = detectarProveedorImagen(urlFotoOriginal);
        
        log.info("Eliminando foto de perfil. URL original: {}, Proveedor: {}, Email: {}", 
                urlFotoOriginal, proveedorImagen, usuario.getEmail());
        
        // Si es una URL de Firebase Storage (nuestra propia imagen subida), la eliminamos
        if (urlFotoOriginal != null && "firebase".equals(proveedorImagen)) {
            try {
                // Las URLs firmadas contienen parámetros de consulta que no son parte del nombre del archivo
                // Necesitamos limpiar la URL antes de intentar eliminar el archivo
                String urlLimpia = urlFotoOriginal;
                if (urlFotoOriginal.contains("?")) {
                    urlLimpia = urlFotoOriginal.split("\\?")[0];
                    log.info("URL limpiada para eliminación: {}", urlLimpia);
                }
                
                storageService.eliminarArchivo(urlLimpia);
                log.info("Archivo eliminado correctamente: {}", urlLimpia);
            } catch (Exception e) {
                log.warn("No se pudo eliminar la foto: {}", e.getMessage());
                // Continuamos con el proceso aunque falle la eliminación
            }
        }
        
        // PASO 1: Buscar explícitamente fotos de Google para este email en la base de datos
        String email = usuario.getEmail();
        log.info("Buscando fotos de Google para el email: {}", email);
        
        // Buscar en todos los usuarios con el mismo email
        List<Usuario> usuariosConMismoEmail = new ArrayList<>();
        try {
            // Primero buscar con findByEmail
            usuarioRepository.findByEmail(email).ifPresent(usuariosConMismoEmail::add);
            
            // Si no encontramos suficientes, buscar con una búsqueda más amplia
            if (usuariosConMismoEmail.isEmpty()) {
                usuariosConMismoEmail = usuarioRepository.findAll().stream()
                    .filter(u -> email.equals(u.getEmail()))
                    .collect(Collectors.toList());
                log.info("Búsqueda amplia encontró {} usuarios con email {}", usuariosConMismoEmail.size(), email);
            }
        } catch (Exception e) {
            log.warn("Error al buscar usuarios con el mismo email: {}", e.getMessage());
        }
        
        // Verificar si alguno tiene una foto de Google real (no genérica)
        String urlGoogle = null;
        
        // Primero buscar fotos de Google no genéricas
        for (Usuario u : usuariosConMismoEmail) {
            if (u.getUrlFoto() != null && 
                u.getUrlFoto().contains("googleusercontent.com") && 
                !u.getUrlFoto().contains("default-user")) {
                
                urlGoogle = u.getUrlFoto();
                log.info("Encontrada foto de Google real (no genérica) para el usuario: {}", urlGoogle);
                
                // Asegurarse de que la URL de Google tenga el tamaño correcto
                if (urlGoogle.contains("=")) {
                    String baseUrl = urlGoogle.split("=")[0];
                    urlGoogle = baseUrl + "=s400-c";
                }
                break;
            }
        }
        
        // Si no encontramos una foto real, buscar cualquier foto de Google
        if (urlGoogle == null) {
            for (Usuario u : usuariosConMismoEmail) {
                if (u.getUrlFoto() != null && u.getUrlFoto().contains("googleusercontent.com")) {
                    urlGoogle = u.getUrlFoto();
                    log.info("Encontrada foto de Google genérica para el usuario: {}", urlGoogle);
                    
                    // Asegurarse de que la URL de Google tenga el tamaño correcto
                    if (urlGoogle.contains("=")) {
                        String baseUrl = urlGoogle.split("=")[0];
                        urlGoogle = baseUrl + "=s400-c";
                    }
                    break;
                }
            }
        }
        
        // PASO 2: Si encontramos una foto de Google, la usamos
        if (urlGoogle != null) {
            log.info("Usando foto de Google encontrada para el usuario ID: {}", id);
            usuario.setUrlFoto(urlGoogle);
            usuarioRepository.save(usuario);
            return urlGoogle;
        }
        
        // PASO 3: Intentar reconstruir la URL de Google basada en el email
        if (email != null && email.endsWith("@gmail.com")) {
            // Extraer el ID de usuario de Google del email
            String googleUserId = email.substring(0, email.indexOf('@'));
            log.info("Intentando reconstruir URL de foto de Google para usuario: {}", googleUserId);
            
            // Construir una URL de foto de Google basada en el ID de usuario
            String googlePhotoUrl = "https://lh3.googleusercontent.com/a/default-user";
            log.info("URL reconstruida de Google: {}", googlePhotoUrl);
            
            usuario.setUrlFoto(googlePhotoUrl);
            usuarioRepository.save(usuario);
            return googlePhotoUrl;
        }
        
        // PASO 4: Si todo lo demás falla, usar la imagen por defecto
        log.info("No se encontró foto de Google, usando imagen por defecto");
        String defaultUrl = "https://storage.googleapis.com/talentmatch-assets/default-avatar.png";
        
        try {
            // Verificar que la URL por defecto es accesible
            java.net.URI uri = java.net.URI.create(defaultUrl);
            java.net.URL url = uri.toURL();
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("HEAD");
            int responseCode = connection.getResponseCode();
            
            if (responseCode != 200) {
                log.warn("La URL de imagen por defecto no es accesible. Código de respuesta: {}", responseCode);
                // Usar una URL alternativa si la predeterminada no está disponible
                defaultUrl = "https://ui-avatars.com/api/?name=" + 
                    (usuario.getNombre() != null ? usuario.getNombre().charAt(0) : "") + 
                    (usuario.getApellido() != null ? usuario.getApellido().charAt(0) : "") + 
                    "&background=38bdf8&color=fff";
                log.info("Usando URL alternativa: {}", defaultUrl);
            }
        } catch (Exception e) {
            log.warn("Error al verificar la URL de imagen por defecto: {}", e.getMessage());
            // Usar una URL alternativa si ocurre un error
            defaultUrl = "https://ui-avatars.com/api/?name=" + 
                (usuario.getNombre() != null ? usuario.getNombre().charAt(0) : "") + 
                (usuario.getApellido() != null ? usuario.getApellido().charAt(0) : "") + 
                "&background=38bdf8&color=fff";
            log.info("Usando URL alternativa: {}", defaultUrl);
        }
        
        usuario.setUrlFoto(defaultUrl);
        usuarioRepository.save(usuario);
        
        log.info("Foto de perfil establecida a la imagen por defecto para el usuario ID: {}", id);
        
        return defaultUrl;
    }
    
    /**
     * Detecta el proveedor de la imagen basado en la URL.
     * 
     * @param url URL de la imagen
     * @return Nombre del proveedor (google, github, firebase, default, null)
     */
    private String detectarProveedorImagen(String url) {
        if (url == null) {
            return null;
        }
        
        if (url.contains("googleusercontent.com")) {
            return "google";
        }
        
        if (url.contains("github.com")) {
            return "github";
        }
        
        if (url.contains("storage.googleapis.com") && url.contains("default-avatar")) {
            return "default";
        }
        
        if (url.contains("storage.googleapis.com") || url.contains("firebasestorage")) {
            return "firebase";
        }
        
        return "otro";
    }

    @Override
    @Transactional
    public UsuarioResponse cambiarEstado(Long id, EstadoUsuario estado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        usuario.setEstado(estado);
        usuario = usuarioRepository.save(usuario);
        
        log.info("Estado actualizado a {} para el usuario ID: {}", estado, id);
        
        return usuarioMapper.toUsuarioResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con email: " + email));
    }

    @Override
    @Transactional
    public void registrarAcceso(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con ID: " + id));
        
        usuario.registrarAcceso();
        usuarioRepository.save(usuario);
        
        log.info("Acceso registrado para el usuario ID: {}", id);
    }
} 