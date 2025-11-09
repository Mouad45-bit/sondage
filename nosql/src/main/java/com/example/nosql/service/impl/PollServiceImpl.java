package com.example.nosql.service.impl;

import com.example.nosql.api.dto.CreatePollRequest;
import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.api.dto.UpdatePollRequest;
import com.example.nosql.dao.PollRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.service.PollService;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class PollServiceImpl implements PollService {
    private final PollRepository repo;
    //
    public PollServiceImpl(PollRepository repo) {
        this.repo = repo;
    }
    //
    @Override
    public Page<Poll> listAll(Pageable pageable) {
        return repo.findAll(pageable);
    }
    //
    @Override
    public Page<Poll> searchByTitle(String query, Pageable pageable) {
        if (query == null || query.isEmpty()) {
            return Page.empty(pageable);
        }
        return repo.findByTitleContainingIgnoreCase(query.trim(), pageable);
    }
    //
    @Override
    public Slice<Poll> searchByAuthorName(String query, Pageable pageable) {
        if (query == null || query.isEmpty()) {
            return Page.empty(pageable);
        }
        return repo.findByAuthorNameContainingIgnoreCase(query.trim(), pageable);
    }
    //
    @Override
    public Page<Poll> listByStatus(String status, Pageable pageable) {
        if (status == null || status.isEmpty()) {
            return Page.empty(pageable);
        }
        return repo.findByStatus(status.trim(), pageable);
    }
    //
    @Override
    public Page<Poll> listOverlapping(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable) {
        if (dateStart == null || dateEnd == null || dateStart.isAfter(dateEnd)) {
            return Page.empty(pageable);
        }
        return repo.findOverlapping(dateStart, dateEnd, pageable);
    }
    //
    @Override
    public Page<Poll> listByAuthorId(String authorId, Pageable pageable) {
        if (authorId == null || authorId.isEmpty()) {
            return Page.empty(pageable);
        }
        return repo.findByAuthorId(authorId, pageable);
    }
    //
    @Override
    public PollResponse create(@NotNull CreatePollRequest poll) {
        //
        LocalDateTime minStart = LocalDateTime.now().plusHours(1);
        //
        if (poll.getDateStart().isBefore(minStart)) {
            throw new IllegalArgumentException("dateStart must be at least 1h from now");
        }
        if (!poll.isStartBeforeEnd()) {
            throw new IllegalArgumentException("dateStart must be before dateEnd");
        }
        //
        List<String> optionsNormalized = poll.getOptions().stream()
                .map(s -> s.trim().replaceAll("\\s+", " "))
                .filter(s -> !s.isBlank())
                .toList();
        //
        List<String> optionsDistinct = optionsNormalized.stream()
                .collect(LinkedHashSet<String>::new,
                        LinkedHashSet<String>::add,
                        LinkedHashSet<String>::addAll)
                .stream()
                .toList();
        //
        if (optionsDistinct.size() < 2) {
            throw new IllegalArgumentException("Options must contain at least 2 values");
        }
        //
        Poll pollToSave = Poll.builder()
                .title(poll.getTitle())
                .description(poll.getDescription())
                .status("DRAFT")
                .dateStart(poll.getDateStart())
                .dateEnd(poll.getDateEnd())
                .options(optionsNormalized)
                .authorId(poll.getAuthorId())
                .build();
        //
        Poll saved = repo.save(pollToSave);
        //
        return new PollResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getDescription(),
                saved.getStatus(),
                saved.getDateStart(),
                saved.getDateEnd(),
                saved.getOptions(),
                saved.getAuthorId()
        );
    }
    //
    public PollResponse update(String id, @NotNull UpdatePollRequest newPoll) {
        Poll poll = repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found")
        );
        //
        if (!"DRAFT".equals(poll.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Update only for drafts");
        }
        //
        if (newPoll.getDescription() != null) {
            poll.setDescription(newPoll.getDescription());
        }
        //
        if (newPoll.getOptions() != null) {
            List<String> optionsNormalized = newPoll.getOptions().stream()
                    .map(s -> s.trim().replaceAll("\\s+", " "))
                    .filter(s -> !s.isBlank())
                    .toList();
            //
            List<String> optionsDistinct = optionsNormalized.stream()
                    .collect(LinkedHashSet<String>::new,
                            LinkedHashSet<String>::add,
                            LinkedHashSet<String>::addAll)
                    .stream().toList();
            //
            if (optionsDistinct.size() < 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Options must contain at least 2 values");
            }
            //
            if (optionsDistinct.stream().anyMatch(s -> s.length() > 80)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Options must be less than 80 characters");
            }
            //
            poll.setDescription(newPoll.getDescription());
        }
        //
        // TODO: dateStart, dateEnd & status
        //
        Poll saved = repo.save(poll);
        //
        return new PollResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getDescription(),
                saved.getStatus(),
                saved.getDateStart(),
                saved.getDateEnd(),
                saved.getOptions(),
                saved.getAuthorId()
        );
    }
    //
    public void delete(String id) {
        Poll poll = repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
        //
        if (!"DRAFT".equals(poll.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delete only for drafts");
        }
        //
        repo.delete(poll);
    }
}
