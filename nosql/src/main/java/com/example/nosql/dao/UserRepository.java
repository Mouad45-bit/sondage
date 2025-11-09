package com.example.nosql.dao;

import com.example.nosql.model.User;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface UserRepository extends Repository<User, String> {
    @Query(value = "{ 'username': { $regex: '^?0$', $options: 'i' } }")
    Optional<User> findByUsername(String username);
    //
    @Query(value = "{ 'username': { $regex: '^?0$', $options: 'i' } }", exists = true)
    boolean existsByUsername(String username);
}
