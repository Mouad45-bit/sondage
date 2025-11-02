package com.example.nosql.dao;

import com.example.nosql.model.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;

public interface PollRepository extends MongoRepository<Poll, String> {
    Page<Poll> findByTitleContainingIgnoreCase(String q, Pageable pageable);
    //
    Page<Poll> findByStatus(String status, Pageable pageable);
    //
    @Query("{ $and: [ { 'dateStart': { $gte: ?0 } }, { 'dateEnd': { $lte: ?1 } } ] }")
    Page<Poll> findContained(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable);
}
