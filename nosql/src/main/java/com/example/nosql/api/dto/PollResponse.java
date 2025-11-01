package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public class PollResponse {
    @NotBlank public String id;
    @NotBlank public String title;
    public String description;
    @NotBlank public String status;
    @NotNull public LocalDate dateStart;
    @NotNull public LocalDate dateEnd;
    @Size(min = 2) public List<@NotBlank String> options;
    @NotBlank public String userId;
}
