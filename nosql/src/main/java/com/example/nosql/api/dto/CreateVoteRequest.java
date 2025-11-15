package com.example.nosql.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateVoteRequest(
        @NotNull
        @Min(0)
        Integer optionIndex
) {
}
