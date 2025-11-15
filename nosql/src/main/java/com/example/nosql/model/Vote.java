package com.example.nosql.model;

import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("votes")
@Builder
public class Vote {
    @Id private String id;
    private String pollId;
    private String userId;
    private int optionIndex;
    private LocalDateTime createdAt;
    //
    public Vote() {}
    public Vote(String id, String pollId, String userId, int optionIndex, LocalDateTime createdAt) {
        this.id = id;
        this.pollId = pollId;
        this.userId = userId;
        this.optionIndex = optionIndex;
        this.createdAt = createdAt;
    }
    //
    public String getId() { return id; }
    public String getPollId() { return pollId; }
    public String getUserId() { return userId; }
    public int getOptionIndex() { return optionIndex; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
