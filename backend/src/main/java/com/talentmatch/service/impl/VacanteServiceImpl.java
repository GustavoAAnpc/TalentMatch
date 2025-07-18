package com.talentmatch.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.talentmatch.dto.request.ActualizacionVacanteRequest;
import com.talentmatch.dto.request.CreacionVacanteRequest;
import com.talentmatch.dto.response.VacanteDetalleResponse;
import com.talentmatch.dto.response.VacanteResumenResponse;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.exception.ValidacionException;
import com.talentmatch.mapper.VacanteMapper;
import com.talentmatch.model.entity.Reclutador;
import com.talentmatch.model.entity.Vacante;
import com.talentmatch.model.entity.PruebaTecnica;
import com.talentmatch.model.enums.EstadoVacante;
import com.talentmatch.repository.VacanteRepository;
import com.talentmatch.repository.PruebaTecnicaRepository;
import com.talentmatch.service.ReclutadorService;
import com.talentmatch.service.VacanteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación del servicio de vacantes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VacanteServiceImpl implements VacanteService {

    private final VacanteRepository vacanteRepository;
    private final VacanteMapper vacanteMapper;
    private final ReclutadorService reclutadorService;
    private final PruebaTecnicaRepository pruebaTecnicaRepository;

    @Override
    @Transactional
    public VacanteDetalleResponse crear(Long reclutadorId, CreacionVacanteRequest request) {
        // Buscar reclutador
        Reclutador reclutador = reclutadorService.buscarReclutadorPorId(reclutadorId);
        
        // Convertir a entidad y establecer relaciones
        Vacante vacante = vacanteMapper.toVacante(request, reclutador);
        
        // Persistir
        vacante = vacanteRepository.save(vacante);
        
        log.info("Vacante creada exitosamente con ID: {}", vacante.getId());
        
        return vacanteMapper.toVacanteDetalleResponse(vacante);
    }

    @Override
    @Transactional(readOnly = true)
    public VacanteDetalleResponse buscarPorId(Long id) {
        Vacante vacante = buscarVacantePorId(id);
        return vacanteMapper.toVacanteDetalleResponse(vacante);
    }

    @Override
    @Transactional
    public VacanteDetalleResponse actualizar(Long id, Long reclutadorId, ActualizacionVacanteRequest request) {
        // Buscar vacante
        Vacante vacante = buscarVacantePorId(id);
        
        // Validar que el reclutador sea el propietario
        if (!vacante.getReclutador().getId().equals(reclutadorId)) {
            throw new ValidacionException("No tienes permiso para actualizar esta vacante");
        }
        
        // Actualizar entidad
        vacanteMapper.actualizarVacante(request, vacante);
        vacante = vacanteRepository.save(vacante);
        
        log.info("Vacante actualizada exitosamente con ID: {}", id);
        
        return vacanteMapper.toVacanteDetalleResponse(vacante);
    }

    @Override
    @Transactional
    public VacanteDetalleResponse cambiarEstado(Long id, Long reclutadorId, EstadoVacante estado) {
        // Buscar vacante
        Vacante vacante = buscarVacantePorId(id);
        
        // Validar que el reclutador sea el propietario
        if (!vacante.getReclutador().getId().equals(reclutadorId)) {
            throw new ValidacionException("No tienes permiso para cambiar el estado de esta vacante");
        }
        
        // Actualizar estado
        vacante.setEstado(estado);
        vacante = vacanteRepository.save(vacante);
        
        log.info("Estado de vacante actualizado a {} con ID: {}", estado, id);
        
        return vacanteMapper.toVacanteDetalleResponse(vacante);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarPorTitulo(String titulo) {
        List<Vacante> vacantes = vacanteRepository.findByTituloContainingIgnoreCase(titulo);
        return vacantes.stream()
                .map(vacanteMapper::toVacanteResumenResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarPorUbicacion(String ubicacion) {
        List<Vacante> vacantes = vacanteRepository.findByUbicacionContainingIgnoreCase(ubicacion);
        return vacantes.stream()
                .map(vacanteMapper::toVacanteResumenResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarPorHabilidad(String habilidad) {
        // Implementar búsqueda por habilidades requeridas
        throw new UnsupportedOperationException("Método no implementado");
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarPorEstado(EstadoVacante estado) {
        List<Vacante> vacantes = vacanteRepository.findByEstado(estado);
        return vacantes.stream()
                .map(vacanteMapper::toVacanteResumenResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarPorReclutador(Long reclutadorId) {
        Reclutador reclutador = reclutadorService.buscarReclutadorPorId(reclutadorId);
        List<Vacante> vacantes = vacanteRepository.findByReclutador(reclutador);
        return vacantes.stream()
                .map(vacanteMapper::toVacanteResumenResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarVacantesActivas() {
        List<Vacante> vacantes = vacanteRepository.findByEstado(EstadoVacante.ACTIVA);
        return vacantes.stream()
                .map(vacanteMapper::toVacanteResumenResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarVacantesDestacadas() {
        // Implementar lógica para determinar vacantes destacadas
        throw new UnsupportedOperationException("Método no implementado");
    }

    @Override
    @Transactional(readOnly = true)
    public List<VacanteResumenResponse> buscarVacantesRecomendadas(Long candidatoId) {
        // Implementar lógica de recomendación basada en el perfil del candidato
        throw new UnsupportedOperationException("Método no implementado");
    }

    @Override
    @Transactional(readOnly = true)
    public Vacante buscarVacantePorId(Long id) {
        return vacanteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vacante no encontrada con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean tienePruebasTecnicasAsociadas(Long id) {
        // Verificar que la vacante exista
        buscarVacantePorId(id);
        
        // Verificar si tiene pruebas técnicas asociadas
        return !pruebaTecnicaRepository.findByVacanteId(id).isEmpty();
    }
    
    @Override
    @Transactional
    public VacanteDetalleResponse actualizarRequierePrueba(Long id, Long reclutadorId, Boolean requierePrueba) {
        // Buscar la vacante
        Vacante vacante = buscarVacantePorId(id);
        
        // Validar que el reclutador sea el propietario
        if (!vacante.getReclutador().getId().equals(reclutadorId)) {
            throw new ValidacionException("No tienes permiso para actualizar esta vacante");
        }
        
        // Actualizar el campo requierePrueba
        vacante.setRequierePrueba(requierePrueba);
        vacante = vacanteRepository.save(vacante);
        
        log.info("Campo requierePrueba actualizado a {} para la vacante con ID: {}", requierePrueba, id);
        
        return vacanteMapper.toVacanteDetalleResponse(vacante);
    }
    
    @Override
    @Transactional
    public void eliminar(Long id, Long reclutadorId, boolean eliminarPruebaTecnica) {
        // Buscar la vacante
        Vacante vacante = buscarVacantePorId(id);
        
        // Validar que el reclutador sea el propietario
        if (!vacante.getReclutador().getId().equals(reclutadorId)) {
            throw new ValidacionException("No tienes permiso para eliminar esta vacante");
        }
        
        // Verificar si tiene pruebas técnicas asociadas
        List<PruebaTecnica> pruebasTecnicas = pruebaTecnicaRepository.findByVacanteId(id);
        
        // Si hay pruebas técnicas asociadas
        if (!pruebasTecnicas.isEmpty()) {
            if (eliminarPruebaTecnica) {
                // Si se solicita eliminar las pruebas técnicas, eliminarlas
                for (PruebaTecnica prueba : pruebasTecnicas) {
                    pruebaTecnicaRepository.delete(prueba);
                    log.info("Prueba técnica eliminada con ID: {} asociada a la vacante ID: {}", prueba.getId(), id);
                }
            } else {
                // Si no se solicita eliminar las pruebas técnicas, desvincularlas de la vacante
                for (PruebaTecnica prueba : pruebasTecnicas) {
                    prueba.setVacante(null);
                    pruebaTecnicaRepository.save(prueba);
                    log.info("Prueba técnica desvinculada con ID: {} de la vacante ID: {}", prueba.getId(), id);
                }
            }
        }
        
        // Eliminar la vacante
        vacanteRepository.delete(vacante);
        log.info("Vacante eliminada con ID: {} por reclutador ID: {}", id, reclutadorId);
    }
} 