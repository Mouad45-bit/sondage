package com.example.nosql.dao;

import com.example.nosql.model.Vote;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface VoteRepository extends Repository<Vote, String> {
    //
    @Query(
            value = "{ 'pollId': ?0, 'userId': ?1 }",
            exists = true
    )
    boolean existsByPollIdAndUserId(String pollId, String userId);
    //
    @Query("{ 'pollId': ?0 }")
    List<Vote> findByPollId(String pollId);
    //
    @Query(
            value = "{ 'pollId': ?0, 'optionIndex': ?1 }",
            count = true
    )
    long countByPollIdAndOptionIndex(String pollId, String optionIndex);
}
