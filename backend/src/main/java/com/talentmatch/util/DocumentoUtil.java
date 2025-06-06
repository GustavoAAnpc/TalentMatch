package com.talentmatch.util;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

/**
 * Utilidad para extraer texto de diferentes tipos de documentos.
 */
@Slf4j
public class DocumentoUtil {

    private DocumentoUtil() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Extrae texto de un archivo según su tipo (PDF, DOCX, TXT).
     *
     * @param archivo Archivo del que se extraerá el texto
     * @return Texto extraído del archivo
     * @throws IOException Si ocurre un error al leer el archivo
     */
    public static String extraerTexto(MultipartFile archivo) throws IOException {
        String contentType = archivo.getContentType();
        if (contentType == null) {
            throw new IOException("Tipo de contenido no especificado");
        }

        byte[] bytes = archivo.getBytes();
        String texto;

        try {
            if (contentType.equals("application/pdf")) {
                texto = extraerTextoDePDF(bytes);
            } else if (contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                texto = extraerTextoDeDOCX(bytes);
            } else if (contentType.equals("application/msword")) {
                // Para archivos DOC antiguos, intentamos procesar como texto plano
                texto = extraerTextoPlano(bytes);
            } else if (contentType.equals("text/plain")) {
                texto = extraerTextoPlano(bytes);
            } else {
                throw new IOException("Tipo de archivo no soportado: " + contentType);
            }

            // Limitar longitud máxima y limpiar el texto
            return limpiarTexto(texto, 10000);
        } catch (Exception e) {
            log.error("Error al extraer texto del archivo: {}", e.getMessage());
            throw new IOException("Error al extraer texto: " + e.getMessage(), e);
        }
    }

    /**
     * Extrae texto de un archivo PDF.
     *
     * @param bytes Contenido del archivo PDF
     * @return Texto extraído del PDF
     * @throws IOException Si ocurre un error al procesar el PDF
     */
    private static String extraerTextoDePDF(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Extrae texto de un archivo DOCX.
     *
     * @param bytes Contenido del archivo DOCX
     * @return Texto extraído del DOCX
     * @throws IOException Si ocurre un error al procesar el DOCX
     */
    private static String extraerTextoDeDOCX(byte[] bytes) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    /**
     * Extrae texto de un archivo de texto plano.
     *
     * @param bytes Contenido del archivo de texto
     * @return Texto extraído
     * @throws IOException Si ocurre un error al leer el archivo
     */
    private static String extraerTextoPlano(byte[] bytes) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8)) {
            char[] buffer = new char[1024];
            int n;
            while ((n = reader.read(buffer)) != -1) {
                sb.append(buffer, 0, n);
            }
        }
        return sb.toString();
    }

    /**
     * Limpia y trunca el texto extraído.
     *
     * @param texto Texto a limpiar
     * @param longitudMaxima Longitud máxima del texto
     * @return Texto limpio y truncado
     */
    private static String limpiarTexto(String texto, int longitudMaxima) {
        if (texto == null) {
            return "";
        }

        // Reemplazar múltiples espacios en blanco y saltos de línea
        String textoLimpio = texto.replaceAll("\\s+", " ")
                                 .replaceAll("\\n+", "\n")
                                 .trim();

        // Truncar si excede la longitud máxima
        if (textoLimpio.length() > longitudMaxima) {
            return textoLimpio.substring(0, longitudMaxima) + "...";
        }

        return textoLimpio;
    }
} 