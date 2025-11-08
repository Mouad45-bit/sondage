package com.example.nosql.dao;

import com.example.nosql.model.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.mongodb.repository.Aggregation;
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
    @Aggregation(pipeline = {
            "{ $lookup: { " +
                    "from: 'users', " +
                    "let:  { aid: '$authorId' }, " +
                    "pipeline: [ " +
                      "{ $match: { $expr: { $eq: ['$_id', '$$aid'] } } }, " +
                      "{ $project: { _id: 1, username: 1 } } " +
                    "], " +
                    "as:  'owner' } }",
            "{ $unwind: { path:  '$owner', preserveNullAndEmptyArrays:  true } }",
            "{ $match: { 'owner.username': { $regex: ?0, $options: 'i' } } }",
            "{ $project: { " +
                    "_id: 1, title: 1, description: 1, status: 1, " +
                    "dateStart: 1, dateEnd: 1, options: 1, authorId: 1 } }"
    })
    Slice<Poll> findByAuthorNameContainingIgnoreCase(String q, Pageable pageable);
    //
    @Query(value = "{ 'status': ?0 }")
    Page<Poll> findByStatus(String status, Pageable pageable);
    //
    @Query(value = "{ $and: [ { 'dateStart': { $lte: ?1 } }, { 'dateEnd': { $gte: ?0 } } ] }")
    Page<Poll> findOverlapping(LocalDateTime dateStart, LocalDateTime dateEnd, Pageable pageable);
    //
    @Query(value = "{ 'authorId': ?0 }")
    Page<Poll> findByAuthorId(String authorId, Pageable pageable);
}
