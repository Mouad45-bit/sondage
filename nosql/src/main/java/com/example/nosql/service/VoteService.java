package com.example.nosql.service;

import com.example.nosql.api.dto.CreateVoteRequest;
import com.example.nosql.api.dto.OptionStatsResponse;
import com.example.nosql.api.dto.PollStatsResponse;
import com.example.nosql.api.dto.VoteResponse;
import com.example.nosql.dao.PollRepository;
import com.example.nosql.dao.VoteRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.model.PollStatus;
import com.example.nosql.model.User;
import com.example.nosql.model.Vote;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VoteService {
    private final VoteRepository voteRepository;
    private final PollRepository pollRepository;
    private final UserService userService;
    //
    public VoteService(VoteRepository voteRepository, PollRepository pollRepository, UserService userService) {
        this.voteRepository = voteRepository;
        this.pollRepository = pollRepository;
        this.userService = userService;
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
    //
    private PollStatsResponse buildStats(Poll poll) {
        String pollId = poll.getId();
        List<String> options = poll.getOptions();
        //
        List<OptionStatsResponse> optionsStats = new ArrayList<>();
        long totalVotes = 0;
        //
        for (int i = 0; i < options.size(); i++) {
            long votes = voteRepository.countByPollIdAndOptionIndex(pollId, i);
            totalVotes += votes;
            //
            optionsStats.add(new OptionStatsResponse(
                    i,
                    options.get(i),
                    votes,
                    0.0
            ));
        }
        //
        if (totalVotes > 0) {
            final long total = totalVotes;
            optionsStats = optionsStats.stream()
                    .map(optStat -> new OptionStatsResponse(
                            optStat.index(),
                            optStat.label(),
                            optStat.votes(),
                            (optStat.votes() * 100.0) / total
                    ))
                    .toList();
        }
        //
        return new PollStatsResponse(
                pollId,
                poll.getTitle(),
                poll.getDescription(),
                poll.getStatus(),
                totalVotes,
                optionsStats
        );
    }
    //
    public PollStatsResponse getResults(String pollId) {
        Poll poll = pollRepository.findById(pollId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
        //
        if (poll.getStatus() != PollStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll is not closed");
        }
        //
        return buildStats(poll);
    }
    //
    public PollStatsResponse getProgress(String pollId, String userId) {
        Poll poll = pollRepository.findById(pollId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
        //
        if (poll.getStatus() != PollStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll is not open");
        }
        //
        User user = userService.getById(userId);
        boolean hasVoted = voteRepository.existsByPollIdAndUserId(pollId, userId);
        if (!hasVoted) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Should participate in vote");
        }
        //
        return buildStats(poll);
    }
}
