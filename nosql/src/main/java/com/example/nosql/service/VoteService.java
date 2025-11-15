package com.example.nosql.service;

import com.example.nosql.api.dto.CreateVoteRequest;
import com.example.nosql.api.dto.VoteResponse;
import com.example.nosql.dao.PollRepository;
import com.example.nosql.dao.VoteRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.model.Vote;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class VoteService {
    private final VoteRepository voteRepository;
    private final PollRepository pollRepository;
    //
    public VoteService(VoteRepository voteRepository, PollRepository pollRepository) {
        this.voteRepository = voteRepository;
        this.pollRepository = pollRepository;
    }
    //
    public VoteResponse createVote(String pollId, String userId, CreateVoteRequest req) {
        //
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
        //
        LocalDateTime now = LocalDateTime.now();
        //
        if (!"OPEN".equalsIgnoreCase(poll.getStatus().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll is not open");
        }
        //
        if (voteRepository.existsByPollIdAndUserId(pollId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted for this poll");
        }
        //
        int index = req.optionIndex();
        if (index < 0 || index >= poll.getOptions().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option index");
        }
        //
        Vote vote = Vote.builder()
                .pollId(pollId)
                .userId(userId)
                .optionIndex(index)
                .createdAt(now)
                .build();
        //
        Vote saved = voteRepository.save(vote);
        //
        return new VoteResponse(
                saved.getId(),
                saved.getPollId(),
                saved.getUserId(),
                saved.getOptionIndex(),
                saved.getCreatedAt()
        );
    }
}
