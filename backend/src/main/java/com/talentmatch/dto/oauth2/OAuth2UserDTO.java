package com.talentmatch.dto.oauth2;

import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para manejar la información de usuarios obtenida de proveedores OAuth2.
 * Este DTO facilita el proceso de mapeo de diferentes proveedores (Google, GitHub, etc.)
 * y permite un manejo más limpio de los datos.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OAuth2UserDTO {
    private String email;
    private String nombre;
    private String apellido;
    private String proveedor;  // google, github, etc.
    private String profileUrl; // URL del perfil en el proveedor (ej. página de GitHub)
    private String imageUrl;   // URL de la imagen de perfil
    private String originalImageUrl; // URL original de la imagen sin modificar
    private Boolean imagenGenerica;  // Indica si la imagen es genérica (default-user) o personalizada
    
    @Builder.Default
    private Map<String, Object> atributosAdicionales = new HashMap<>();
} 