package com.example.nosql.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {
    @Id private String id;
    @Indexed(unique = true) private String username;
    //
    public User(){};
    //
    public User(String id, String username) {
        this.id = id;
        this.username = username;
    }
    //
    public String getId() {return id;}
    public String getUsername() {return username;}
    //
    public void setUsername(String username) {this.username = username;}
}
