package com.example.nosql.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class UpdatePollRequest {
    @Size(max = 500) private String description;
    /* TODO: dateStart & dateEnd
    @NotNull private LocalDateTime dateStart;
    @NotNull private LocalDateTime dateEnd;
    */
    @Size(min = 2) private List<@NotBlank @Size(max = 80) String> options;
    //
    public String getDescription() { return description; }
    /*
    public LocalDateTime getDateStart() { return dateStart; }
    public LocalDateTime getDateEnd() { return dateEnd; }
     */
    public List<@NotBlank @Size(max = 80) String> getOptions() { return options; }
}
