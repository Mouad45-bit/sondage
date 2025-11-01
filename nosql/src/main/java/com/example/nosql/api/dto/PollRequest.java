package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public class PollRequest {
    @NotBlank @Size(max = 120) public String title;
    @Size(max = 500) public String description;
    @NotNull public LocalDate dateStart;
    @NotNull public LocalDate dateEnd;
    @Size(min = 2) public List<@NotBlank String> options;
    //
    @AssertTrue(message="dateStart must be before dateEnd")
    public boolean isStartBeforeEnd() {
        return dateStart != null && dateEnd != null && dateStart.isBefore(dateEnd);
    }
}
