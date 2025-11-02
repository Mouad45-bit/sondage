package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class PollRequest {
    @NotBlank @Size(max = 120) private String title;
    @Size(max = 500) private String description;
    @NotNull private LocalDateTime dateStart;
    @NotNull private LocalDateTime dateEnd;
    @NotBlank private String status;
    @Size(min = 2) private List<@NotBlank String> options;
    @NotBlank private String authorId;
    //
    @AssertTrue(message="dateStart must be before dateEnd")
    public boolean isStartBeforeEnd() {
        return dateStart != null && dateEnd != null && dateStart.isBefore(dateEnd);
    }
}
