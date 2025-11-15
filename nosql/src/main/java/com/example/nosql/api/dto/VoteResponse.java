package com.example.nosql.api.dto;

import java.time.LocalDateTime;

public record VoteResponse(
        String id,
        String pollId,
        String userId,
        int optionIndex,
        LocalDateTime createdAt
) {
}
