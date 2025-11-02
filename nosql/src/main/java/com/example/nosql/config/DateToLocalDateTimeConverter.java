package com.example.nosql.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;

@ReadingConverter
public class DateToLocalDateTimeConverter implements Converter<Date, LocalDateTime> {
    @Override
    public LocalDateTime convert(Date source) {
        if (source == null) {
            return null;
        }
        return LocalDateTime.ofInstant(source.toInstant(), ZoneOffset.UTC);
    }
}
