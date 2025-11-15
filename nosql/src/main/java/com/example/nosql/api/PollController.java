package com.example.nosql.api;

import com.example.nosql.api.dto.CreatePollRequest;
import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.api.dto.PollStatsResponse;
import com.example.nosql.api.dto.UpdatePollRequest;
import com.example.nosql.api.mapper.PollMapper;
import com.example.nosql.model.Poll;
import com.example.nosql.model.PollStatus;
import com.example.nosql.service.PollService;
import com.example.nosql.service.UserService;
import com.example.nosql.service.VoteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/polls")
public class PollController {
    private final PollService pollService;
    private final PollMapper mapper;
    private final UserService userService;
    private final VoteService voteService;

    //
    public PollController(
            PollService pollService, PollMapper mapper, UserService userService, VoteService voteService
    ) {
        this.pollService = pollService;
        this.mapper = mapper;
        this.userService = userService;
        this.voteService = voteService;
    }
    //
    @GetMapping
    public Page<PollResponse> listAll(
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = pollService.listAll(pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping(value = "/search", params = { "title", "!author" })
    public Page<PollResponse> searchByTitle(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = pollService.searchByTitle(title, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping(value = "/search", params = { "author", "!title" })
    public Slice<PollResponse> searchByAuthorName(
            @RequestParam String author,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Slice<Poll> page = pollService.searchByAuthorName(author, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping("/status/{status}")
    public Page<PollResponse> listByStatus(
            @PathVariable PollStatus status,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = pollService.listByStatus(status, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping("/overlapped")
    public Page<PollResponse> listOverlapping(
            @RequestParam("from")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            //
            @RequestParam("to")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            //
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = pollService.listOverlapping(from, to, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping("/author/{authorId}")
    public Page<PollResponse> listByAuthorId(
            @PathVariable String authorId,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = pollService.listByAuthorId(authorId, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @PostMapping
    public ResponseEntity<PollResponse> create(
            @Valid @RequestBody CreatePollRequest poll,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User user
    ) {
        String authorId = userService.getByUsernameEntity(user.getUsername()).getId();
        PollResponse resp = pollService.create(poll, authorId);
        //
        return ResponseEntity
                .created(URI.create("/api/polls/" + resp.getId()))
                .body(resp);
    }
    //
    @PatchMapping("/{id}")
    public ResponseEntity<PollResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdatePollRequest newPoll,
            Authentication auth
    ) {
        String currentUserId = (String) auth.getDetails();
        //
        PollResponse resp = pollService.update(id, newPoll, currentUserId);
        //
        return ResponseEntity.ok(resp);
    }
    //
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            Authentication auth
    ) {
        String currentUserId = (String) auth.getDetails();
        //
        pollService.delete(id, currentUserId);
        //
        return ResponseEntity.noContent().build();
    }
    //
    @GetMapping("/{id}")
    public ResponseEntity<PollResponse> getById(@PathVariable String id) {
        Poll poll = pollService.getById(id);
        PollResponse response = mapper.toResponse(poll);
        return ResponseEntity.ok(response);
    }
    //
    @GetMapping("/{id}/results")
    public ResponseEntity<PollStatsResponse> getResult(@PathVariable String pollId) {
        PollStatsResponse stats = voteService.getResults(pollId);
        return ResponseEntity.ok(stats);
    }
    @GetMapping("/{id}/progress")
    public ResponseEntity<PollStatsResponse> getProgress(
            @PathVariable String pollId,
            Authentication auth
    ) {
        String currentUserId = (String) auth.getDetails();
        PollStatsResponse stats = voteService.getProgress(pollId, currentUserId);
        return ResponseEntity.ok(stats);
    }
}
