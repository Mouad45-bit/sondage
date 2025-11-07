package com.example.nosql.service;

import com.example.nosql.model.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface PollService {
    Page<Poll> listAll(Pageable pageable);
    //
    Page<Poll> searchByTitle(String query, Pageable pageable);
    //
    Page<Poll> searchByAuthorName(String query, Pageable pageable);
    //
    Page<Poll> listByStatus(String status, Pageable pageable);
    //
    Page<Poll> listOverlapping(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable);
}
