package com.talentmatch.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Reclutador;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.model.enums.EstadoUsuario;
import com.talentmatch.model.enums.RolUsuario;
import com.talentmatch.repository.CandidatoRepository;
import com.talentmatch.repository.ReclutadorRepository;
import com.talentmatch.repository.UsuarioRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Clase que inicializa datos por defecto al arrancar la aplicación
 */
@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private ReclutadorRepository reclutadorRepository;
    
    @Autowired
    private CandidatoRepository candidatoRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Método que se ejecuta al iniciar la aplicación
     */
    @Override
    public void run(String... args) throws Exception {
        log.info("Inicializando datos por defecto...");
        
        crearUsuarioReclutadorPorDefecto();
        crearUsuarioCandidatoPorDefecto();
        crearUsuarioAdministradorPorDefecto();
        
        log.info("Inicialización de datos completada.");
    }
    
    /**
     * Crea un usuario reclutador por defecto si no existe ninguno
     */
    private void crearUsuarioReclutadorPorDefecto() {
        log.info("Verificando si existe un usuario reclutador predeterminado...");
        
        // Verificar si ya existe algún usuario con rol RECLUTADOR
        boolean existeReclutador = usuarioRepository.findAll().stream()
                .anyMatch(user -> user.getRol() == RolUsuario.RECLUTADOR);
        
        if (existeReclutador) {
            log.info("Ya existe al menos un usuario reclutador en el sistema.");
            return;
        }
        
        log.info("Creando usuario reclutador predeterminado...");
        
        try {
            // Crear usuario reclutador usando SuperBuilder
            Reclutador reclutador = Reclutador.builder()
                .email("reclutador@vertex.com")
                .password(passwordEncoder.encode("reclutador123"))
                .nombre("Reclutador")
                .apellido("Predeterminado")
                .rol(RolUsuario.RECLUTADOR)
                .estado(EstadoUsuario.ACTIVO)
                .puesto("Reclutador")
                .cargo("Reclutador Senior")
                .departamento("Recursos Humanos")
                .infoEmpresa("Vertex - Empresa líder en tecnología")
                .build();
            
            // Guardar reclutador (incluye usuario)
            reclutadorRepository.save(reclutador);
            
            log.info("Usuario reclutador predeterminado creado exitosamente: reclutador@vertex.com / reclutador123");
        } catch (Exception e) {
            log.error("Error al crear usuario reclutador predeterminado: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Crea usuarios candidatos por defecto si no existe ninguno
     */
    private void crearUsuarioCandidatoPorDefecto() {
        log.info("Verificando si existe un usuario candidato predeterminado...");
        
        // Verificar si ya existe algún usuario con rol CANDIDATO
        boolean existeCandidato = usuarioRepository.findAll().stream()
                .anyMatch(user -> user.getRol() == RolUsuario.CANDIDATO);
        
        if (existeCandidato) {
            log.info("Ya existe al menos un usuario candidato en el sistema.");
            return;
        }
        
        log.info("Creando usuarios candidatos predeterminados...");
        
        try {
            // Crear primer usuario candidato usando SuperBuilder
            Candidato candidato1 = Candidato.builder()
                .email("candidato@ejemplo.com")
                .password(passwordEncoder.encode("candidato123"))
                .nombre("Candidato")
                .apellido("Ejemplo")
                .rol(RolUsuario.CANDIDATO)
                .estado(EstadoUsuario.ACTIVO)
                .tituloProfesional("Desarrollador Full Stack")
                .resumenPerfil("Desarrollador Full Stack con experiencia en aplicaciones web modernas")
                .habilidadesPrincipales("Java, Spring Boot, React, Angular, TypeScript")
                .experienciaAnios(3)
                .build();
            
            // Crear segundo usuario candidato usando SuperBuilder
            Candidato candidato2 = Candidato.builder()
                .email("ana.garcia@ejemplo.com")
                .password(passwordEncoder.encode("candidato123"))
                .nombre("Ana")
                .apellido("García")
                .rol(RolUsuario.CANDIDATO)
                .estado(EstadoUsuario.ACTIVO)
                .tituloProfesional("Ingeniera DevOps")
                .resumenPerfil("Ingeniera DevOps con experiencia en implementación de CI/CD y automatización de infraestructura")
                .habilidadesPrincipales("Docker, Kubernetes, AWS, Jenkins, Terraform, Python")
                .experienciaAnios(5)
                .build();
            
            // Guardar candidatos
            candidatoRepository.save(candidato1);
            candidatoRepository.save(candidato2);
            
            log.info("Usuarios candidatos predeterminados creados exitosamente");
        } catch (Exception e) {
            log.error("Error al crear usuarios candidatos predeterminados: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Crea un usuario administrador por defecto si no existe ninguno
     */
    private void crearUsuarioAdministradorPorDefecto() {
        log.info("Verificando si existe un usuario administrador predeterminado...");
        
        // Verificar si ya existe algún usuario con rol ADMINISTRADOR
        boolean existeAdmin = usuarioRepository.findAll().stream()
                .anyMatch(user -> user.getRol() == RolUsuario.ADMINISTRADOR);
        
        if (existeAdmin) {
            log.info("Ya existe al menos un usuario administrador en el sistema.");
            return;
        }
        
        log.info("Creando usuario administrador predeterminado...");
        
        try {
            // Crear usuario administrador
            Usuario admin = Usuario.builder()
                .email("admin@vertex.com")
                .password(passwordEncoder.encode("admin123"))
                .nombre("Administrador")
                .apellido("Sistema")
                .rol(RolUsuario.ADMINISTRADOR)
                .estado(EstadoUsuario.ACTIVO)
                .build();
            
            // Guardar administrador
            usuarioRepository.save(admin);
            
            log.info("Usuario administrador predeterminado creado exitosamente: admin@vertex.com / admin123");
        } catch (Exception e) {
            log.error("Error al crear usuario administrador predeterminado: {}", e.getMessage(), e);
        }
    }
} 