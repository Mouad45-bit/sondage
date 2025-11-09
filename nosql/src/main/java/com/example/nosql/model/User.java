package com.example.nosql.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {
    @Id private String id;
    @Indexed(unique = true) private String username;
    private String passwordHash;
    //
    public User(){};
    //
    public User(String id, String username, String passwordHash) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
    }
    //
    public String getId() {return id;}
    public String getUsername() {return username;}
    public String getPasswordHash() {return passwordHash;}
    //
    public void setUsername(String username) {this.username = username;}
    public void setPasswordHash(String passwordHash) {this.passwordHash = passwordHash;}
}
