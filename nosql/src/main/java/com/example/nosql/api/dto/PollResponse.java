package com.example.nosql.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class PollResponse {
    @NotBlank public String id;
    @NotBlank public String title;
    public String description;
    @NotBlank public String status;
    @NotNull public LocalDateTime dateStart;
    @NotNull public LocalDateTime dateEnd;
    @Size(min = 2) public List<@NotBlank String> options;
    @NotBlank public String authorId;
    //
    public void setId(String id) {this.id = id;}
    public void setTitle(String title) {this.title = title;}
    public void setDescription(String description) {this.description = description;}
    public void setStatus(String status) {this.status = status;}
    public void setDateStart(LocalDateTime dateStart) {this.dateStart = dateStart;}
    public void setDateEnd(LocalDateTime dateEnd) {this.dateEnd = dateEnd;}
    public void setOptions(List<@NotBlank String> options) {this.options = options;}
    public void setAuthorId(String authorId) {this.authorId = authorId;}
}
