package com.talentmatch.controller;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.talentmatch.dto.request.SubirDocumentoRequest;
import com.talentmatch.dto.response.DocumentoResponse;
import com.talentmatch.model.entity.Usuario;
import com.talentmatch.model.entity.Documento;
import com.talentmatch.service.DocumentoService;
import com.talentmatch.service.StorageService;
import com.talentmatch.service.impl.FirebaseStorageServiceImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/documentos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Documentos", description = "API para gestionar documentos de candidatos")
@SecurityRequirement(name = "bearerAuth")
public class DocumentoController {

    private final DocumentoService documentoService;
    private final StorageService storageService;

    @PostMapping
    @Operation(summary = "Subir un nuevo documento")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR')")
    public ResponseEntity<DocumentoResponse> subirDocumento(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam("archivo") MultipartFile archivo,
            @Valid SubirDocumentoRequest request) {
        
        log.info("Solicitud de subida de documento para usuario ID: {}", usuario.getId());
        return ResponseEntity.ok(documentoService.subirDocumento(usuario.getId(), archivo, request));
    }

    @GetMapping("/candidato/{candidatoId}")
    @Operation(summary = "Obtener todos los documentos de un candidato")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and " +
                  "(authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<DocumentoResponse>> obtenerDocumentosPorCandidato(
            @Parameter(description = "ID del candidato") @PathVariable Long candidatoId) {
        
        return ResponseEntity.ok(documentoService.obtenerDocumentosPorCandidato(candidatoId));
    }

    @GetMapping("/candidato/{candidatoId}/tipo/{tipo}")
    @Operation(summary = "Obtener documentos de un candidato por tipo")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and " +
                  "(authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<List<DocumentoResponse>> obtenerDocumentosPorTipo(
            @Parameter(description = "ID del candidato") @PathVariable Long candidatoId,
            @Parameter(description = "Tipo de documento") @PathVariable String tipo) {
        
        return ResponseEntity.ok(documentoService.obtenerDocumentosPorTipo(candidatoId, tipo));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un documento por su ID")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<DocumentoResponse> obtenerPorId(
            @Parameter(description = "ID del documento") @PathVariable Long id) {
        
        return ResponseEntity.ok(documentoService.obtenerPorId(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un documento")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarDocumento(
            @Parameter(description = "ID del documento") @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        
        documentoService.eliminarDocumento(id, usuario.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/principal")
    @Operation(summary = "Establecer un documento como principal (CV)")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'ADMINISTRADOR')")
    public ResponseEntity<DocumentoResponse> establecerComoPrincipal(
            @Parameter(description = "ID del documento") @PathVariable Long id,
            @Parameter(description = "ID del candidato") @RequestParam Long candidatoId) {
        
        return ResponseEntity.ok(documentoService.establecerComoPrincipal(id, candidatoId));
    }

    @GetMapping("/candidato/{candidatoId}/principal")
    @Operation(summary = "Obtener el documento principal (CV) de un candidato")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR') and " +
                  "(authentication.principal.id == #candidatoId or hasAnyRole('RECLUTADOR', 'ADMINISTRADOR'))")
    public ResponseEntity<DocumentoResponse> obtenerDocumentoPrincipal(
            @Parameter(description = "ID del candidato") @PathVariable Long candidatoId) {
        
        DocumentoResponse documento = documentoService.obtenerDocumentoPrincipal(candidatoId);
        return documento != null ? ResponseEntity.ok(documento) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/view")
    @Operation(summary = "Obtener URL firmada para visualizar un documento")
    @PreAuthorize("hasAnyRole('CANDIDATO', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> obtenerUrlFirmada(
            @Parameter(description = "ID del documento") @PathVariable Long id) {
        
        try {
            Documento documento = documentoService.buscarDocumentoPorId(id);
            
            // Generar URL firmada con 60 minutos de validez
            String urlFirmada = ((FirebaseStorageServiceImpl) storageService).generarUrlTemporal(documento.getUrl(), 60);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", urlFirmada);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al generar URL firmada para documento ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Error al generar URL firmada: " + e.getMessage());
        }
    }
} 