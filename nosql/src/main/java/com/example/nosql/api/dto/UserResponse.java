package com.example.nosql.api.dto;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class UserResponse {
    public String id;
    public String username;
    //
    public String getId() {return id;}
    public String getUsername() {return username;}
    //
    public void setId(String id) {this.id = id;}
    public void setUsername(String username) {this.username = username;}
}
