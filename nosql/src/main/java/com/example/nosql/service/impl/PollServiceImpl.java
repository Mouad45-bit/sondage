package com.example.nosql.service.impl;

import com.example.nosql.dao.PollRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.service.PollService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
}
