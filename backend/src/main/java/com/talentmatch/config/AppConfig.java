package com.talentmatch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuración general de la aplicación.
 */
@Configuration
public class AppConfig {
    
    /**
     * Bean para RestTemplate utilizado en llamadas HTTP a APIs externas para OAuth2.
     * 
     * @return Instancia de RestTemplate
     */
    @Bean
    public RestTemplate oauth2RestTemplate() {
        return new RestTemplate();
    }
} 