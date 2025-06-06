package com.talentmatch.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.SubirDocumentoRequest;
import com.talentmatch.dto.response.DocumentoResponse;
import com.talentmatch.exception.OperacionInvalidaException;
import com.talentmatch.exception.RecursoNoEncontradoException;
import com.talentmatch.mapper.DocumentoMapper;
import com.talentmatch.model.entity.Candidato;
import com.talentmatch.model.entity.Documento;
import com.talentmatch.model.enums.TipoDocumento;
import com.talentmatch.repository.DocumentoRepository;
import com.talentmatch.service.CandidatoService;
import com.talentmatch.service.DocumentoService;
import com.talentmatch.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class DocumentoServiceImpl implements DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final CandidatoService candidatoService;
    private final StorageService storageService;
    private final DocumentoMapper documentoMapper;

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public DocumentoResponse subirDocumento(Long candidatoId, MultipartFile archivo, SubirDocumentoRequest request) {
        log.info("Subiendo documento para candidato ID: {}", candidatoId);
        
        // Validar tipo de documento
        try {
            TipoDocumento.valueOf(request.getTipo());
        } catch (IllegalArgumentException e) {
            throw new OperacionInvalidaException("Tipo de documento no válido: " + request.getTipo());
        }
        
        // Validar formato y tamaño del archivo
        validarArchivo(archivo);
        
        Candidato candidato = candidatoService.buscarCandidatoPorId(candidatoId);
        
        // Generar nombre único para el archivo
        String nombreArchivo = generarNombreUnico(archivo.getOriginalFilename());
        
        // Guardar el archivo
        String ruta = "candidatos/" + candidatoId + "/documentos";
        String url = storageService.guardarArchivo(archivo, ruta, nombreArchivo);
        
        // Crear y guardar el documento
        Documento documento = Documento.builder()
                .candidato(candidato)
                .nombre(archivo.getOriginalFilename())
                .tipo(request.getTipo())
                .descripcion(request.getDescripcion())
                .url(url)
                .esPrincipal(false)
                .build();
        
        documento = documentoRepository.save(documento);
        
        // Si se solicita establecer como principal y es un CV
        if (Boolean.TRUE.equals(request.getEstablecerComoPrincipal()) && 
            TipoDocumento.CURRICULUM_VITAE.name().equals(request.getTipo())) {
            candidato.setDocumentoPrincipal(documento);
        }
        
        log.info("Documento subido exitosamente con ID: {}", documento.getId());
        
        return documentoMapper.toDocumentoResponse(documento);
    }

    @Override
    public List<DocumentoResponse> obtenerDocumentosPorCandidato(Long candidatoId) {
        return documentoRepository.findByCandidatoId(candidatoId).stream()
                .map(documentoMapper::toDocumentoResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DocumentoResponse> obtenerDocumentosPorTipo(Long candidatoId, String tipo) {
        return documentoRepository.findByCandidatoIdAndTipoOrderByFechaCreacionDesc(candidatoId, tipo).stream()
                .map(documentoMapper::toDocumentoResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DocumentoResponse obtenerPorId(Long id) {
        return documentoMapper.toDocumentoResponse(buscarDocumentoPorId(id));
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public void eliminarDocumento(Long id, Long candidatoId) {
        Documento documento = buscarDocumentoPorId(id);
        
        // Validar que el documento pertenece al candidato
        if (!documento.getCandidato().getId().equals(candidatoId)) {
            throw new OperacionInvalidaException("No tienes permiso para eliminar este documento");
        }
        
        // Si es el documento principal, actualizar la referencia
        if (Boolean.TRUE.equals(documento.getEsPrincipal())) {
            documento.getCandidato().setDocumentoPrincipal(null);
        }
        
        // Eliminar el archivo
        storageService.eliminarArchivo(documento.getUrl());
        
        // Eliminar el documento
        documentoRepository.delete(documento);
        
        log.info("Documento ID: {} eliminado", id);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR') and (authentication.principal.id == #candidatoId or hasRole('ADMINISTRADOR'))")
    public DocumentoResponse establecerComoPrincipal(Long id, Long candidatoId) {
        Documento documento = buscarDocumentoPorId(id);
        
        // Validar que el documento pertenece al candidato
        if (!documento.getCandidato().getId().equals(candidatoId)) {
            throw new OperacionInvalidaException("No tienes permiso para modificar este documento");
        }
        
        // Validar que es un CV
        if (!TipoDocumento.CURRICULUM_VITAE.name().equals(documento.getTipo())) {
            throw new OperacionInvalidaException("Solo se puede establecer como principal un Curriculum Vitae");
        }
        
        documento.getCandidato().setDocumentoPrincipal(documento);
        documento = documentoRepository.save(documento);
        
        log.info("Documento ID: {} establecido como principal para candidato ID: {}", id, candidatoId);
        
        return documentoMapper.toDocumentoResponse(documento);
    }

    @Override
    public DocumentoResponse obtenerDocumentoPrincipal(Long candidatoId) {
        return documentoRepository.findByCandidatoIdAndEsPrincipalTrue(candidatoId)
                .map(documentoMapper::toDocumentoResponse)
                .orElse(null);
    }

    @Override
    public Documento buscarDocumentoPorId(Long id) {
        return documentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró documento con ID: " + id));
    }

    /**
     * Valida el formato y tamaño del archivo.
     * 
     * @param archivo Archivo a validar
     * @throws OperacionInvalidaException si el archivo no cumple con los requisitos
     */
    private void validarArchivo(MultipartFile archivo) {
        if (archivo.isEmpty()) {
            throw new OperacionInvalidaException("El archivo está vacío");
        }
        
        // Verificar tamaño máximo (10MB)
        long maxSize = 10 * 1024 * 1024;
        if (archivo.getSize() > maxSize) {
            throw new OperacionInvalidaException("El archivo excede el tamaño máximo permitido de 10MB");
        }
        
        // Verificar tipo de archivo permitido
        String contentType = archivo.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") && 
                !contentType.equals("application/msword") && 
                !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
                !contentType.equals("image/jpeg") &&
                !contentType.equals("image/png"))) {
            throw new OperacionInvalidaException("Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX, JPG y PNG");
        }
    }

    /**
     * Genera un nombre único para el archivo.
     * 
     * @param nombreOriginal Nombre original del archivo
     * @return Nombre único generado
     */
    private String generarNombreUnico(String nombreOriginal) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String nombreLimpio = nombreOriginal.replaceAll("[^a-zA-Z0-9.-]", "_");
        return timestamp + "_" + nombreLimpio;
    }
} 