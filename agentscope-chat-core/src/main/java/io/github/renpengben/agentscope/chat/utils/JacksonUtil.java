package io.github.renpengben.agentscope.chat.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;


public class JacksonUtil {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  static {
    OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    OBJECT_MAPPER.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    JavaTimeModule javaTimeModule = new JavaTimeModule();
    String dateFormat = "yyyy-MM-dd";
    String dateTimeFormat = "yyyy-MM-dd HH:mm:ss";
    String timeFormat = "HH:mm:ss";

    javaTimeModule.addSerializer(LocalDate.class,
        new LocalDateSerializer(DateTimeFormatter.ofPattern(dateFormat)));
    javaTimeModule.addDeserializer(LocalDate.class,
        new LocalDateDeserializer(DateTimeFormatter.ofPattern(dateFormat)));

    javaTimeModule.addSerializer(LocalDateTime.class,
        new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(dateTimeFormat)));
    javaTimeModule.addDeserializer(LocalDateTime.class,
        new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(dateTimeFormat)));

    javaTimeModule.addSerializer(LocalTime.class,
        new LocalTimeSerializer(DateTimeFormatter.ofPattern(timeFormat)));
    javaTimeModule.addDeserializer(LocalTime.class,
        new LocalTimeDeserializer(DateTimeFormatter.ofPattern(timeFormat)));

    OBJECT_MAPPER.registerModule(javaTimeModule);
  }


  private JacksonUtil() {
    throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
  }


  public static String toJson(Object obj) throws JsonProcessingException {
    return OBJECT_MAPPER.writeValueAsString(obj);
  }


  public static <T> T fromJson(String json, Class<T> clazz) throws JsonProcessingException {
    return OBJECT_MAPPER.readValue(json, clazz);
  }


  public static <T> T fromJson(String json, TypeReference<T> typeReference)
      throws JsonProcessingException {
    return OBJECT_MAPPER.readValue(json, typeReference);
  }


  public static <T> List<T> toList(String json, Class<T> elementClass)
      throws JsonProcessingException {
    return fromJson(json, new TypeReference<List<T>>() {
    });
  }


  public static <T> Map<String, T> toMap(String json, Class<T> valueClass)
      throws JsonProcessingException {
    return fromJson(json, new TypeReference<Map<String, T>>() {
    });
  }

  public static ObjectMapper getObjectMapper() {
    return OBJECT_MAPPER;
  }
}
