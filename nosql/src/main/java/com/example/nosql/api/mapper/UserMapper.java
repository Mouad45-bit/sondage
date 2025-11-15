package com.example.nosql.api.mapper;

import com.example.nosql.api.dto.UserResponse;
import com.example.nosql.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toResponse(User user) {
        if (user == null) { return null; }
        //
        return new UserResponse(
                user.getId(),
                user.getUsername()
        );
    }
}
