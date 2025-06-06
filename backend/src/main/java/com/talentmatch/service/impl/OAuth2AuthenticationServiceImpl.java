package com.talentmatch.service.impl;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.talentmatch.dto.oauth2.OAuth2UserDTO;
import com.talentmatch.dto.response.AutenticacionResponse;
import com.talentmatch.dto.response.UsuarioResponse;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.model.enums.EstadoUsuario;
import com.talentmatch.model.enums.RolUsuario;
import com.talentmatch.repository.UsuarioRepository;
import com.talentmatch.security.JwtService;
import com.talentmatch.service.OAuth2AuthenticationService;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class OAuth2AuthenticationServiceImpl implements OAuth2AuthenticationService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    
    public OAuth2AuthenticationServiceImpl(
            UsuarioRepository usuarioRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            @Qualifier("oauth2RestTemplate") RestTemplate oauth2RestTemplate) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public AutenticacionResponse procesarAutenticacionOAuth2(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        log.info("Procesando autenticación OAuth2...");
        
        // Obtener información del proveedor y del usuario
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        log.info("Proveedor OAuth2: {}", registrationId);
        log.debug("Atributos del usuario OAuth2: {}", attributes);
        
        // Mapear datos del usuario según el proveedor
        OAuth2UserDTO userDTO = mapearDatosUsuario(registrationId, attributes);
        
        // Buscar o crear el usuario en la base de datos
        Usuario usuario = buscarOCrearUsuario(userDTO);
            
            // Generar token JWT
        String token = jwtService.generarTokenParaUsuario(usuario.getId());
            
        // Construir respuesta
        AutenticacionResponse response = construirRespuestaAutenticacion(usuario, token);
        
        log.info("Autenticación OAuth2 completada para: {}", usuario.getEmail());
        return response;
    }
    
    /**
     * Mapea los datos del usuario según el proveedor OAuth2.
     */
    private OAuth2UserDTO mapearDatosUsuario(String proveedor, Map<String, Object> attributes) {
        OAuth2UserDTO.OAuth2UserDTOBuilder builder = OAuth2UserDTO.builder()
                .proveedor(proveedor)
                .atributosAdicionales(attributes);
        
        if ("google".equals(proveedor)) {
            return mapearUserInfoGoogle(builder, attributes);
        } else if ("github".equals(proveedor)) {
            OAuth2UserDTO dto = mapearUserInfoGitHub(builder, attributes);
            log.info("Datos mapeados de GitHub - Nombre: {}, Apellido: {}, Email: {}, Foto: {}", 
                    dto.getNombre(), dto.getApellido(), dto.getEmail(), dto.getImageUrl());
            return dto;
        } else {
            throw new IllegalArgumentException("Proveedor OAuth2 no soportado: " + proveedor);
        }
    }
    
    /**
     * Busca un usuario existente o crea uno nuevo basado en los datos OAuth2.
     */
    @Transactional
    private Usuario buscarOCrearUsuario(OAuth2UserDTO userDTO) {
        // Buscar usuario por email
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(userDTO.getEmail());
        
        if (usuarioExistente.isPresent()) {
            log.info("Usuario existente encontrado con email: {}", userDTO.getEmail());
            Usuario usuario = usuarioExistente.get();
            actualizarDatosUsuario(usuario, userDTO);
            return usuario;
        } else {
            log.info("Usuario no encontrado, creando nuevo usuario OAuth2");
            Long userId = crearNuevoUsuario(userDTO);
            return usuarioRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Error al crear usuario OAuth2"));
        }
    }
    
    /**
     * Construye la respuesta de autenticación con el token y datos del usuario.
     */
    private AutenticacionResponse construirRespuestaAutenticacion(Usuario usuario, String token) {
        return AutenticacionResponse.builder()
                .token(token)
                .user(UsuarioResponse.builder()
                        .id(usuario.getId())
                        .nombre(usuario.getNombre())
                        .apellido(usuario.getApellido())
                        .email(usuario.getEmail())
                        .rol(usuario.getRol())
                        .urlFoto(usuario.getUrlFoto())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public Long obtenerOCrearUsuario(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        final String registrationId = userRequest.getClientRegistration().getRegistrationId();
        final Map<String, Object> attributes = oAuth2User.getAttributes();
        
        log.info("Obteniendo información de usuario desde proveedor {}", registrationId);
        log.debug("Atributos recibidos: {}", attributes);
        
        // Mapear datos del proveedor a nuestro DTO
        OAuth2UserDTO dto = mapearDatosUsuario(registrationId, attributes);
        
        // Buscar usuario existente o crear uno nuevo
        return usuarioRepository.findByEmail(dto.getEmail())
                .map(usuario -> {
                    log.info("Usuario existente encontrado con email: {}", dto.getEmail());
                    return usuario.getId();
                })
                .orElseGet(() -> crearNuevoUsuario(dto));
    }
    
    /**
     * Mapea la información de usuario desde Google.
     */
    private OAuth2UserDTO mapearUserInfoGoogle(OAuth2UserDTO.OAuth2UserDTOBuilder builder, Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String nombre = (String) attributes.get("given_name");
        String apellido = (String) attributes.get("family_name");
        String imageUrl = (String) attributes.get("picture");
        
        log.info("Datos mapeados de Google - Nombre: {}, Apellido: {}, Email: {}", 
                nombre, apellido, email);
        log.info("URL de imagen de perfil de Google (original): {}", imageUrl);
        
        // Asegurarse de que la URL de la imagen es accesible y tenga el formato correcto
        if (imageUrl != null) {
            // Guardar la URL original sin modificar para asegurar compatibilidad
            // Las URLs de Google pueden tener diferentes formatos
            String originalUrl = imageUrl;
            
            // Verificar si la URL parece ser la genérica de default-user
            boolean esImagenGenerica = imageUrl.contains("default-user");
            if (esImagenGenerica) {
                log.warn("La URL de imagen de Google parece ser genérica: {}", imageUrl);
            } else {
                log.info("URL de imagen de perfil real de Google detectada: {}", imageUrl);
            }
            
            // Verificar si la URL ya tiene un parámetro de tamaño
            if (imageUrl.contains("=")) {
                try {
                    // Extraer la URL base (antes del primer '=')
                    String baseUrl = imageUrl.split("=")[0];
                    // Agregar el parámetro para una imagen más grande y sin restricciones
                    imageUrl = baseUrl + "=s400-c";
                } catch (Exception e) {
                    // Si hay algún error al manipular la URL, usar la original
                    log.warn("Error al modificar URL de Google, usando original: {}", e.getMessage());
                    imageUrl = originalUrl;
                }
            }
            
            log.info("URL de imagen de perfil de Google modificada: {}", imageUrl);
            
            // Guardar también la URL sin modificar para referencia futura
            builder.originalImageUrl(originalUrl);
            
            // Marcar explícitamente si es una imagen real o genérica
            builder.imagenGenerica(esImagenGenerica);
        } else {
            // Si no hay URL de imagen, intentar construir una basada en el email
            if (email != null && email.endsWith("@gmail.com")) {
                // Extraer el ID de usuario de Google del email para registrarlo en los logs
                String googleUserId = email.substring(0, email.indexOf('@'));
                log.info("No se proporcionó URL de imagen para usuario de Google: {}", googleUserId);
                
                // Usar URL por defecto para usuarios de Google
                String fallbackImageUrl = "https://lh3.googleusercontent.com/a/default-user";
                log.info("Usando URL por defecto: {}", fallbackImageUrl);
                imageUrl = fallbackImageUrl;
                
                // Marcar como imagen genérica
                builder.imagenGenerica(true);
            }
        }
        
        return builder
                .email(email)
                .nombre(nombre)
                .apellido(apellido)
                .imageUrl(imageUrl)
                .build();
    }
    
    /**
     * Mapea la información de usuario desde GitHub.
     */
    private OAuth2UserDTO mapearUserInfoGitHub(OAuth2UserDTO.OAuth2UserDTOBuilder builder, Map<String, Object> attributes) {
        // Manejar el email
        String email = (String) attributes.get("email");
        if (email == null || email.isEmpty()) {
            log.info("Email no proporcionado por GitHub, se usará un identificador alternativo");
            String login = (String) attributes.get("login");
            log.info("Se usará el nombre de usuario '{}' como identificador", login);
        }
        
        // Manejar nombre y apellido
        String nombre;
        String apellido = null;
        
            String nombreCompleto = (String) attributes.get("name");
        if (nombreCompleto != null && !nombreCompleto.isEmpty()) {
                String[] partes = nombreCompleto.split(" ", 2);
            nombre = partes[0];
            if (partes.length > 1) {
                apellido = partes[1];
            }
            } else {
            // Si no hay nombre completo, usar login como nombre
            nombre = (String) attributes.get("login");
            log.info("Nombre no proporcionado por GitHub, usando login: {}", nombre);
        }
        
        // Obtener URLs
        String avatarUrl = (String) attributes.get("avatar_url");
        String profileUrl = (String) attributes.get("html_url");
        
        log.info("Avatar URL de GitHub: {}", avatarUrl);
        log.info("Nombre mapeado de GitHub: {}, Apellido: {}", nombre, apellido);
        
        return builder
                .email(email)
                .nombre(nombre)
                .apellido(apellido != null ? apellido : "")
                .imageUrl(avatarUrl)
                .profileUrl(profileUrl)
                .build();
    }
    
    /**
     * Crea un nuevo usuario basado en la información OAuth2.
     */
    private Long crearNuevoUsuario(OAuth2UserDTO dto) {
        log.info("Creando nuevo usuario OAuth2 con email: {}", dto.getEmail());
        
        Candidato candidato = new Candidato();
        candidato.setEmail(dto.getEmail());
        candidato.setNombre(dto.getNombre());
        candidato.setApellido(dto.getApellido());
        candidato.setRol(RolUsuario.CANDIDATO);
        candidato.setEstado(EstadoUsuario.ACTIVO);
        candidato.setFechaCreacion(LocalDateTime.now());
        
        // Marcar explícitamente como usuario OAuth2
        candidato.setAutenticacionOAuth2(true);
        
        // Guardar la URL de la foto
        if (dto.getImageUrl() != null) {
            log.info("Guardando URL de foto para nuevo usuario: {}", dto.getImageUrl());
            candidato.setUrlFoto(dto.getImageUrl());
        }
        
        // Configurar datos específicos según el proveedor
        if ("google".equals(dto.getProveedor())) {
            log.info("Usuario autenticado con Google - Email: {}", dto.getEmail());
        } else if ("github".equals(dto.getProveedor())) {
            candidato.setGithubUrl(dto.getProfileUrl());
            log.info("Usuario autenticado con GitHub - Email: {}", dto.getEmail());
        }
        
        // Generar una contraseña aleatoria para usuarios OAuth2
        String passwordAleatoria = UUID.randomUUID().toString();
        candidato.setPassword(passwordEncoder.encode(passwordAleatoria));
        
        Candidato usuarioGuardado = usuarioRepository.save(candidato);
        log.info("Nuevo usuario creado por OAuth2: {}, ID: {}, Foto URL: {}", 
                dto.getEmail(), usuarioGuardado.getId(), usuarioGuardado.getUrlFoto());
        
        return usuarioGuardado.getId();
    }

    /**
     * Actualiza los datos de un usuario existente con la información OAuth2.
     */
    private void actualizarDatosUsuario(Usuario usuario, OAuth2UserDTO userDTO) {
        log.info("Actualizando datos de usuario existente: {}", usuario.getEmail());
        
        usuario.setNombre(userDTO.getNombre());
        usuario.setApellido(userDTO.getApellido());
        
        // Actualizar la URL de la foto solo si viene del proveedor OAuth2
        if (userDTO.getImageUrl() != null) {
            log.info("Actualizando URL de foto para usuario {}: {}", usuario.getEmail(), userDTO.getImageUrl());
            usuario.setUrlFoto(userDTO.getImageUrl());
        }
        
        if (usuario instanceof Candidato) {
            Candidato candidato = (Candidato) usuario;
            
            // Marcar explícitamente que el usuario se autenticó con OAuth2
            candidato.setAutenticacionOAuth2(true);
            
            // Actualizar la URL específica del proveedor
            if ("github".equals(userDTO.getProveedor())) {
                candidato.setGithubUrl(userDTO.getProfileUrl());
            }
        }
        
        usuarioRepository.save(usuario);
        log.info("Datos de usuario actualizados correctamente");
    }
} 