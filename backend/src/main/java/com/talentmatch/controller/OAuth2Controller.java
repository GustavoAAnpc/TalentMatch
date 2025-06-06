package com.talentmatch.controller;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.talentmatch.dto.response.AutenticacionResponse;
import com.talentmatch.service.OAuth2AuthenticationService;

import lombok.extern.slf4j.Slf4j;

/**
 * Controlador para manejar la autenticación OAuth2.
 */
@RestController
@RequestMapping("/api/oauth2")
@Slf4j
public class OAuth2Controller {

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OAuth2AuthenticationService oAuth2AuthenticationService;
    private final RestTemplate restTemplate;
    
    @Value("${frontend.url}")
    private String frontendUrl;
    
    public OAuth2Controller(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AuthenticationService oAuth2AuthenticationService,
            @Qualifier("oauth2RestTemplate") RestTemplate restTemplate) {
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.oAuth2AuthenticationService = oAuth2AuthenticationService;
        this.restTemplate = restTemplate;
    }
    
    /**
     * Endpoint para iniciar el flujo de autorización OAuth2.
     * 
     * @param provider El proveedor OAuth2 (google, github)
     * @return URL de autorización
     */
    @GetMapping("/authorization/{provider}")
    public ResponseEntity<Map<String, String>> getAuthorizationUrl(@PathVariable String provider) {
        log.info("Iniciando flujo de autorización OAuth2 para proveedor: {}", provider);
        
        // Obtener la configuración del proveedor
        ClientRegistration registration = clientRegistrationRepository.findByRegistrationId(provider);
        if (registration == null) {
            log.error("Proveedor OAuth2 no soportado: {}", provider);
            return ResponseEntity.badRequest().build();
        }
        
        // Construir URL de redirección
        String redirectUri = "http://localhost:8080/api/oauth2/callback/" + provider;
        log.info("URL de redirección configurada: {}", redirectUri);
        
        // Construir URL de autorización
        String authorizationUrl = buildAuthorizationUrl(registration, redirectUri, provider);
        log.info("URL de autorización generada: {}", authorizationUrl);
        
        // Devolver la URL al frontend
        Map<String, String> response = new HashMap<>();
        response.put("authorizationUrl", authorizationUrl);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Construye la URL de autorización con los parámetros necesarios.
     */
    private String buildAuthorizationUrl(ClientRegistration registration, String redirectUri, String provider) {
        String authorizationUri = registration.getProviderDetails().getAuthorizationUri();
        String clientId = registration.getClientId();
        String scope = String.join(" ", registration.getScopes());
        
        StringBuilder urlBuilder = new StringBuilder();
        urlBuilder.append(authorizationUri)
            .append("?client_id=").append(clientId)
            .append("&redirect_uri=").append(redirectUri)
            .append("&scope=").append(scope)
            .append("&response_type=code");
        
        // Agregar parámetros específicos para cada proveedor
        if ("github".equals(provider)) {
            urlBuilder.append("&prompt=consent");
        }
        
        return urlBuilder.toString();
    }
    
    /**
     * Endpoint para manejar el callback de OAuth2.
     * 
     * @param provider El proveedor OAuth2 (google, github)
     * @param code El código de autorización
     * @return Redirección al frontend con el token
     */
    @GetMapping("/callback/{provider}")
    public ResponseEntity<Void> handleCallback(
            @PathVariable String provider,
            @RequestParam("code") String code) {
        
        try {
            log.info("Procesando callback de OAuth2 para proveedor: {}", provider);
            
            // Obtener la configuración del proveedor
            ClientRegistration registration = clientRegistrationRepository.findByRegistrationId(provider);
            if (registration == null) {
                log.error("Proveedor OAuth2 no encontrado: {}", provider);
                return redirectToErrorPage("Proveedor de autenticación no soportado");
            }
            
            // Obtener token de acceso
            String accessToken = getAccessToken(registration, code, provider);
            if (accessToken == null) {
                return redirectToErrorPage("No se pudo obtener el token de acceso");
            }
            
            // Obtener información del usuario
            OAuth2User oAuth2User = getUserInfo(registration, accessToken);
            
            // Procesar autenticación
            AutenticacionResponse authResponse = processAuthentication(registration, accessToken, oAuth2User);
            
            // Redirigir al frontend con el token
            return redirectToSuccessPage(authResponse.getToken());
            
        } catch (Exception e) {
            log.error("Error en el proceso de autenticación OAuth2: {}", e.getMessage(), e);
            return redirectToErrorPage("Error en la autenticación: " + e.getMessage());
        }
    }
    
    /**
     * Obtiene el token de acceso del proveedor OAuth2.
     */
    private String getAccessToken(ClientRegistration registration, String code, String provider) {
        try {
            String tokenEndpoint = registration.getProviderDetails().getTokenUri();
            String redirectUri = "http://localhost:8080/api/oauth2/callback/" + provider;
            
            log.info("Intercambiando código por token de acceso: redirectUri={}", redirectUri);
            
            Map<String, String> params = new HashMap<>();
            params.put("grant_type", "authorization_code");
            params.put("code", code);
            params.put("client_id", registration.getClientId());
            params.put("client_secret", registration.getClientSecret());
            params.put("redirect_uri", redirectUri);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = restTemplate.postForObject(
                    tokenEndpoint, params, Map.class);
            
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                log.error("No se pudo obtener token de acceso para el proveedor: {}", provider);
                return null;
            }
            
            return tokenResponse.get("access_token").toString();
        } catch (Exception e) {
            log.error("Error al obtener token de acceso: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Obtiene la información del usuario del proveedor OAuth2.
     */
    private OAuth2User getUserInfo(ClientRegistration registration, String accessToken) {
        OAuth2AccessToken oAuth2AccessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                accessToken,
                null,
                null);
        
        OAuth2UserRequest userRequest = new OAuth2UserRequest(registration, oAuth2AccessToken);
        DefaultOAuth2UserService userService = new DefaultOAuth2UserService();
        
        return userService.loadUser(userRequest);
    }
    
    /**
     * Procesa la autenticación del usuario OAuth2.
     */
    private AutenticacionResponse processAuthentication(
            ClientRegistration registration, 
            String accessToken,
            OAuth2User oAuth2User) {
        
        OAuth2AccessToken oAuth2AccessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                accessToken,
                null,
                null);
        
        OAuth2UserRequest userRequest = new OAuth2UserRequest(registration, oAuth2AccessToken);
        
        return oAuth2AuthenticationService.procesarAutenticacionOAuth2(userRequest, oAuth2User);
    }
    
    /**
     * Redirige al frontend con el token JWT.
     */
    private ResponseEntity<Void> redirectToSuccessPage(String token) {
        try {
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8.toString());
            String redirectUrl = frontendUrl + "/oauth2/success?token=" + encodedToken;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(redirectUrl));
            
            log.info("Redirigiendo al frontend: {}", redirectUrl);
            
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        } catch (Exception e) {
            log.error("Error al redirigir al frontend: {}", e.getMessage(), e);
            return redirectToErrorPage("Error al procesar la autenticación");
        }
    }
    
    /**
     * Redirige al frontend con un mensaje de error.
     */
    private ResponseEntity<Void> redirectToErrorPage(String errorMessage) {
        try {
            String encodedMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8.toString());
            String redirectUrl = frontendUrl + "/oauth2/error?message=" + encodedMessage;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(redirectUrl));
            
            log.info("Redirigiendo a página de error: {}", redirectUrl);
            
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        } catch (Exception e) {
            log.error("Error al redirigir a página de error: {}", e.getMessage(), e);
            
            // En caso de error crítico, redirigir a la página de login
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(frontendUrl + "/login"));
            
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }
    }
} 