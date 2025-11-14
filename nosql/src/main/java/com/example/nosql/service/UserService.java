package com.example.nosql.service;

import com.example.nosql.api.dto.RegisterRequest;
import com.example.nosql.dao.UserRepository;
import com.example.nosql.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    //
    public User register(RegisterRequest req) {
        String username = req.username().toLowerCase().trim();
        //
        if (repo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already in use");
        }
        //
        User user = User.builder()
                .username(username)
                .passwordHash(encoder.encode(req.password()))
                .build();
        return repo.save(user);
    }
    //
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String usernameLower = username.toLowerCase().trim();
        //
        User user = repo.findByUsername(usernameLower).orElseThrow(() ->
                new UsernameNotFoundException("Username " + username + " not found"));
        //
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                Collections.emptyList()
        );
    }
    //
    public User getByUsernameEntity(String username) {
        return repo.findByUsername(username.toLowerCase().trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
