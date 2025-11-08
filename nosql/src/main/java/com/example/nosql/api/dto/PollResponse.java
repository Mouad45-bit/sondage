package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class PollResponse {
    private String id;
    private String title;
    private String description;
    private String status;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private List<String> options;
    private String authorId;
    //
    public PollResponse() {}
    //
    public PollResponse(String id, String title, String description, String status, LocalDateTime dateStart,
                        LocalDateTime dateEnd, List<String> options, String authorId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.dateStart = dateStart;
        this.dateEnd = dateEnd;
        this.options = options;
        this.authorId = authorId;
    }
    //
    public String getId() {return id;}
    public String getTitle() {return title;}
    public String getDescription() {return description;}
    public String getStatus() {return status;}
    public LocalDateTime getDateStart() {return dateStart;}
    public LocalDateTime getDateEnd() {return dateEnd;}
    public List<String> getOptions() {return options;}
    public String getAuthorId() {return authorId;}
    //
    public void setId(String id) {this.id = id;}
    public void setTitle(String title) {this.title = title;}
    public void setDescription(String description) {this.description = description;}
    public void setStatus(String status) {this.status = status;}
    public void setDateStart(LocalDateTime dateStart) {this.dateStart = dateStart;}
    public void setDateEnd(LocalDateTime dateEnd) {this.dateEnd = dateEnd;}
    public void setOptions(List<String> options) {this.options = options;}
    public void setAuthorId(String authorId) {this.authorId = authorId;}
}
