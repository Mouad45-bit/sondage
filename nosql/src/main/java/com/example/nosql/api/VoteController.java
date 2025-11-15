package com.example.nosql.api;

import com.example.nosql.api.dto.CreateVoteRequest;
import com.example.nosql.api.dto.VoteResponse;
import com.example.nosql.service.UserService;
import com.example.nosql.service.VoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/polls/{pollId}/votes")
public class VoteController {
    private final VoteService voteService;
    private final UserService userService;
    //
    public VoteController(VoteService voteService, UserService userService) {
        this.voteService = voteService;
        this.userService = userService;
    }
    //
    @PostMapping
    public ResponseEntity<VoteResponse> createVote(
            @PathVariable String pollId,
            @Valid @RequestBody CreateVoteRequest req,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User user
    ) {
        String userId = userService.getByUsernameEntity(user.getUsername()).getId();
        //
        VoteResponse response = voteService.createVote(pollId, userId, req);
        //
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
