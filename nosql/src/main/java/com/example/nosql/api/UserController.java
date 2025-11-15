package com.example.nosql.api;

import com.example.nosql.api.dto.UserResponse;
import com.example.nosql.api.mapper.UserMapper;
import com.example.nosql.model.User;
import com.example.nosql.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;
    //
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable String id) {
        User user = userService.getById(id);
        //
        UserResponse response = userMapper.toResponse(user);
        //
        return ResponseEntity.ok(response);
    }
}
