package com.example.nosql.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;

@Configuration
public class MongoConfig {
    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(Arrays.asList(
                //
                (Converter<Date, LocalDateTime>) source ->
                        LocalDateTime.ofInstant(source.toInstant(), ZoneId.systemDefault()),
                (Converter<LocalDateTime, Date>) source ->
                        Date.from(source.atZone(ZoneId.systemDefault()).toInstant())
        ));
    }
}
