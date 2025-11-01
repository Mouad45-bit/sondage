package com.example.nosql.api.dto;

import jakarta.validation.constraints.NotBlank;

public class UserResponse {
    @NotBlank public String id;
    @NotBlank public String username;
}
