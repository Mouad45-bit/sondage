package com.example.nosql.api.dto;

import com.example.nosql.model.PollStatus;

import java.util.List;

public record PollStatsResponse(
        String pollId,
        String title,
        String description,
        PollStatus status,
        long totalVotes,
        List<OptionStatsResponse> options
) {
}
