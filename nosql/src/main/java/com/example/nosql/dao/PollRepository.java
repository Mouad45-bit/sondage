package com.example.nosql.dao;

import com.example.nosql.model.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.Repository;


import java.time.LocalDateTime;

public interface PollRepository extends Repository<Poll, String> {
    //
    @Query(value = "{}")
    Page<Poll> findAll(Pageable pageable);
    //
    @Query(value = "{ 'title': { $regex: ?0, $options: 'i' } }")
    Page<Poll> findByTitleContainingIgnoreCase(String q, Pageable pageable);
    //
    @Query(value = "{ 'status': ?0 }")
    Page<Poll> findByStatus(String status, Pageable pageable);
    //
    @Query(value = "{ $and: [ { 'dateStart': { $lte: ?1 } }, { 'dateEnd': { $gte: ?0 } } ] }")
    Page<Poll> findOverlapping(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable);
}
