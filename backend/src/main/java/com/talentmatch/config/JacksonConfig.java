package com.talentmatch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;

/**
 * Configuración de Jackson para el manejo de fechas y tiempos.
 * Esta clase configura cómo Spring debe manejar la serialización y deserialización 
 * de objetos LocalDate y LocalDateTime.
 * 
 * Problemas resueltos:
 * 1. Deserialización de fechas desde el frontend (formato ISO)
 * 2. Serialización de fechas hacia el frontend en un formato consistente
 * 3. Manejo de diferentes formatos de entrada para las fechas
 * 
 * Esta configuración permite que los campos 'fechaPublicacion' y 'fechaCierre' en
 * CreacionVacanteRequest y ActualizacionVacanteRequest se puedan deserializar correctamente
 * desde el frontend, incluso si vienen en diferentes formatos.
 */
@Configuration
public class JacksonConfig {

    /**
     * Formato para fechas sin hora (YYYY-MM-DD)
     * Este formato se utiliza para LocalDate, compatible con input type="date" en HTML.
     */
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    
    /**
     * Formato para fechas con hora (YYYY-MM-DDThh:mm:ss)
     * Este formato se utiliza para LocalDateTime, compatible con ISO 8601.
     */
    public static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
    
    /**
     * Configura un ObjectMapper personalizado para el manejo correcto de fechas.
     * 
     * @return ObjectMapper configurado para el manejo de fechas
     */
    @Bean
    public ObjectMapper objectMapper() {
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Configurar un formateador de fechas más flexible que acepte múltiples formatos
        DateTimeFormatter dateFormatter = new DateTimeFormatterBuilder()
                .appendPattern(DATE_FORMAT)
                .optionalStart()
                .appendPattern("'T'HH:mm:ss")
                .optionalEnd()
                .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
                .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
                .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
                .toFormatter();
        
        // Configurar serializadores y deserializadores para LocalDate
        javaTimeModule.addSerializer(LocalDate.class, new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_FORMAT)));
        javaTimeModule.addDeserializer(LocalDate.class, new LocalDateDeserializer(dateFormatter));
        
        // Configurar serializadores y deserializadores para LocalDateTime
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
        
        return Jackson2ObjectMapperBuilder.json()
                .modules(javaTimeModule)
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .featuresToEnable(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
                .featuresToEnable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT)
                // Permitir fallos en propiedades desconocidas
                .featuresToDisable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                // Ser tolerante con fechas inválidas
                .featuresToDisable(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE)
                .build();
    }
} 