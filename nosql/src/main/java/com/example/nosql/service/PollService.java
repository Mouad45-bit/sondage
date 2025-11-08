package com.example.nosql.service;

import com.example.nosql.api.dto.PollRequest;
import com.example.nosql.api.dto.PollResponse;
import com.example.nosql.model.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.time.LocalDateTime;

public interface PollService {
    Page<Poll> listAll(Pageable pageable);
    //
    Page<Poll> searchByTitle(String query, Pageable pageable);
    //
    Slice<Poll> searchByAuthorName(String query, Pageable pageable);
    //
    Page<Poll> listByStatus(String status, Pageable pageable);
    //
    Page<Poll> listOverlapping(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable);
    //
    Page<Poll> listByAuthorId(String authorId, Pageable pageable);
    //
    PollResponse create(PollRequest poll);
}
