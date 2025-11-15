package com.example.nosql.model;

import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document("polls")
@Builder
public class Poll {
    @Id private String id;
    private String title;
    private String description;
    private PollStatus status;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private List<String> options;
    //
    private String authorId;
    //
    public Poll() {};
    //
    public Poll(String id, String title, String description, PollStatus status,
                LocalDateTime dateStart, LocalDateTime dateEnd, List<String> options, String authorId) {
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
    public PollStatus getStatus() {return status;}
    public LocalDateTime getDateStart() {return dateStart;}
    public LocalDateTime getDateEnd() {return dateEnd;}
    public List<String> getOptions() {return options;}
    public String getAuthorId() {return authorId;}
    //
    public void setDescription(String description) {this.description = description;}
    public void setStatus(PollStatus status) {this.status = status;}
    public void setDateStart(LocalDateTime dateStart) {this.dateStart = dateStart;}
    public void setDateEnd(LocalDateTime dateEnd) {this.dateEnd = dateEnd;}
    public void setOptions(List<String> options) {this.options = options;}
}
