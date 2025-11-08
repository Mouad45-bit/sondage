package com.example.nosql.service.impl;

import com.example.nosql.api.dto.PollRequest;
import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.dao.PollRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.service.PollService;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

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
    public PollResponse create(@NotNull PollRequest poll) {
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
            throw new IllegalArgumentException("options must contain at least 2 options");
        }
        //
        LocalDateTime now = LocalDateTime.now();
        String status;
        if (now.isBefore(poll.getDateStart())) {
            status = "DRAFT";
        } else if (!now.isAfter(poll.getDateEnd())) {
            status = "OPEN";
        } else {
            status = "CLOSED";
        }
        //
        Poll pollToSave = new Poll(
                poll.getId(),
                poll.getTitle().trim(),
                (poll.getDescription() == null ? null : poll.getDescription().trim()),
                status,
                poll.getDateStart(),
                poll.getDateEnd(),
                optionsDistinct,
                poll.getAuthorId()
        );
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
}
