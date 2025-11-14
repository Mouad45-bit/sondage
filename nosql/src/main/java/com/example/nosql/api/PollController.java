package com.example.nosql.api;

import com.example.nosql.api.dto.CreatePollRequest;
import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.api.dto.UpdatePollRequest;
import com.example.nosql.api.mapper.PollMapper;
import com.example.nosql.model.Poll;
import com.example.nosql.service.PollService;
import com.example.nosql.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/polls")
public class PollController {
    private final PollService service;
    private final PollMapper mapper;
    private final UserService userService;

    //
    public PollController(PollService service, PollMapper mapper, UserService userService) {
        this.service = service;
        this.mapper = mapper;
        this.userService = userService;
    }
    //
    @GetMapping
    public Page<PollResponse> listAll(
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = service.listAll(pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping(value = "/search", params = { "title", "!author" })
    public Page<PollResponse> searchByTitle(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = service.searchByTitle(title, pageable);
        return page.map(mapper::toResponse);
    }
    @GetMapping(value = "/search", params = { "author", "!title" })
    public Slice<PollResponse> searchByAuthorName(
            @RequestParam String author,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Slice<Poll> page = service.searchByAuthorName(author, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping("/status/{status}")
    public Page<PollResponse> listByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = service.listByStatus(status, pageable);
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
        Page<Poll> page = service.listOverlapping(from, to, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @GetMapping("/author/{authorId}")
    public Page<PollResponse> listByAuthorId(
            @PathVariable String authorId,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = service.listByAuthorId(authorId, pageable);
        return page.map(mapper::toResponse);
    }
    //
    @PostMapping
    public ResponseEntity<PollResponse> create(
            @Valid @RequestBody CreatePollRequest poll,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User user
    ) {
        String authorId = userService.getByUsernameEntity(user.getUsername()).getId();
        PollResponse resp = service.create(poll, authorId);
        //
        return ResponseEntity
                .created(URI.create("/api/polls/" + resp.getId()))
                .body(resp);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<PollResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdatePollRequest newPoll
    ) {
        PollResponse resp = service.update(id, newPoll);
        //
        return ResponseEntity.ok(resp);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        //
        return ResponseEntity.noContent().build();
    }
}
