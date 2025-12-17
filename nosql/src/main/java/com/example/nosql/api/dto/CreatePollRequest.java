package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class CreatePollRequest {
    @NotBlank @Size(min = 3, max = 120) private String title;
    @Size(max = 500) private String description;
    @NotNull private LocalDateTime dateStart;
    @NotNull private LocalDateTime dateEnd;
    @Size(min = 2) private List<@NotBlank @Size(max = 80) String> options;
    //
    @AssertTrue(message="dateStart must be before dateEnd")
    public boolean isStartBeforeEnd() {
        return dateStart != null && dateEnd != null && dateStart.isBefore(dateEnd);
    }
    //
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDateTime getDateStart() { return dateStart; }
    public LocalDateTime getDateEnd() { return dateEnd; }
    public List<String> getOptions() { return options; }
}
