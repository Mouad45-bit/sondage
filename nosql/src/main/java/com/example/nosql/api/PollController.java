package com.example.nosql.api;

import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.api.mapper.PollMapper;
import com.example.nosql.model.Poll;
import com.example.nosql.service.PollService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/polls")
public class PollController {
    private final PollService service;
    private final PollMapper mapper;
    //
    public PollController(PollService service, PollMapper mapper) {
        this.service = service;
        this.mapper = mapper;
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
    @GetMapping("/search")
    public Page<PollResponse> searchByTitle(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "dateStart", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<Poll> page = service.searchByTitle(title, pageable);
        return page.map(mapper::toResponse);
    }
    @GetMapping("/search")
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
}
