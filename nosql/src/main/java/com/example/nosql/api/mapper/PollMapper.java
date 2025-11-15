package com.example.nosql.api.mapper;

import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.model.Poll;
import org.springframework.stereotype.Component;

@Component
public class PollMapper {
    public PollResponse toResponse(Poll poll) {
        if (poll == null) {
            return null;
        }
        PollResponse response = new PollResponse();
        response.setId(poll.getId());
        response.setTitle(poll.getTitle());
        response.setDescription(poll.getDescription());
        response.setStatus(poll.getStatus().name());
        response.setDateStart(poll.getDateStart());
        response.setDateEnd(poll.getDateEnd());
        response.setOptions(poll.getOptions());
        response.setAuthorId(poll.getAuthorId());
        return response;
    }
}
