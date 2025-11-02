package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class PollRequest {
    @NotBlank @Size(max = 120) public String title;
    @Size(max = 500) public String description;
    @NotNull public LocalDateTime dateStart;
    @NotNull public LocalDateTime dateEnd;
    @NotBlank public String status;
    @Size(min = 2) public List<@NotBlank String> options;
    @NotBlank public String authorId;
    //
    @AssertTrue(message="dateStart must be before dateEnd")
    public boolean isStartBeforeEnd() {
        return dateStart != null && dateEnd != null && dateStart.isBefore(dateEnd);
    }
}
