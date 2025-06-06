package com.talentmatch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.CertificacionRepository;
import com.talentmatch.repository.EducacionRepository;
import com.talentmatch.repository.ExperienciaLaboralRepository;
import com.talentmatch.repository.HabilidadRepository;
import com.talentmatch.repository.IdiomaRepository;
import com.talentmatch.service.CertificacionService;
import com.talentmatch.service.EducacionService;
import com.talentmatch.service.ExperienciaLaboralService;
import com.talentmatch.service.HabilidadService;
import com.talentmatch.service.IdiomaService;
import com.talentmatch.service.impl.CertificacionServiceImpl;
import com.talentmatch.service.impl.EducacionServiceImpl;
import com.talentmatch.service.impl.ExperienciaLaboralServiceImpl;
import com.talentmatch.service.impl.HabilidadServiceImpl;
import com.talentmatch.service.impl.IdiomaServiceImpl;

import lombok.RequiredArgsConstructor;

/**
 * Configuración para los servicios relacionados con el candidato.
 */
@Configuration
@RequiredArgsConstructor
public class CandidatoConfig {

    private final CandidatoRepository candidatoRepository;
    private final EducacionRepository educacionRepository;
    private final HabilidadRepository habilidadRepository;
    private final CertificacionRepository certificacionRepository;
    private final IdiomaRepository idiomaRepository;
    private final ExperienciaLaboralRepository experienciaLaboralRepository;
    
    /**
     * Bean para el servicio de educación.
     * 
     * @return Implementación del servicio
     */
    @Bean
    public EducacionService educacionService() {
        return new EducacionServiceImpl(educacionRepository, candidatoRepository);
    }
    
    /**
     * Bean para el servicio de habilidades.
     * 
     * @return Implementación del servicio
     */
    @Bean
    public HabilidadService habilidadService() {
        return new HabilidadServiceImpl(habilidadRepository, candidatoRepository);
    }
    
    /**
     * Bean para el servicio de certificaciones.
     * 
     * @return Implementación del servicio
     */
    @Bean
    public CertificacionService certificacionService() {
        return new CertificacionServiceImpl(certificacionRepository, candidatoRepository);
    }
    
    /**
     * Bean para el servicio de idiomas.
     * 
     * @return Implementación del servicio
     */
    @Bean
    public IdiomaService idiomaService() {
        return new IdiomaServiceImpl(idiomaRepository, candidatoRepository);
    }
    
    /**
     * Bean para el servicio de experiencias laborales.
     * 
     * @return Implementación del servicio
     */
    @Bean
    public ExperienciaLaboralService experienciaLaboralService() {
        return new ExperienciaLaboralServiceImpl(experienciaLaboralRepository, candidatoRepository);
    }
} 