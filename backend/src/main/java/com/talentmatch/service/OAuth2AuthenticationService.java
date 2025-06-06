package com.talentmatch.service;

import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.talentmatch.dto.response.AutenticacionResponse;

public interface OAuth2AuthenticationService {
    
    /**
     * Procesa la autenticación OAuth2 y registra/actualiza el usuario si es necesario.
     * 
     * @param userRequest La solicitud OAuth2 del usuario
     * @param oAuth2User El usuario OAuth2 autenticado
     * @return Respuesta de autenticación con token JWT y datos del usuario
     */
    AutenticacionResponse procesarAutenticacionOAuth2(OAuth2UserRequest userRequest, OAuth2User oAuth2User);
    
    /**
     * Obtiene o crea un usuario basado en los datos de OAuth2.
     * 
     * @param userRequest La solicitud OAuth2 del usuario
     * @param oAuth2User El usuario OAuth2 autenticado
     * @return ID del usuario en el sistema
     */
    Long obtenerOCrearUsuario(OAuth2UserRequest userRequest, OAuth2User oAuth2User);
} 