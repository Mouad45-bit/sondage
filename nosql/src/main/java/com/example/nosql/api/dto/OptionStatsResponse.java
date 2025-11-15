package com.example.nosql.api.dto;

public record OptionStatsResponse(
        int index,
        String label,
        long votes,
        double percentage
) {
}
