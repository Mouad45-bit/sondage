package com.example.nosql.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;

@WritingConverter
public class LocalDateTimeToDateConverter implements Converter<LocalDateTime, Date> {
    @Override
    public Date convert(LocalDateTime source) {
        if (source == null) {
            return null;
        }
        return Date.from(source.toInstant(ZoneOffset.UTC));
    }
}
