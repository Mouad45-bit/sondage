package com.example.nosql.service;

import com.example.nosql.dao.PollRepository;
import com.example.nosql.model.Poll;
import com.example.nosql.model.PollStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PollStatusScheduler {
    private final PollRepository pollRepository;
    //
    @Scheduled(fixedDelay = 60_000)
    public void updatePollStatuses() {
        LocalDateTime now = LocalDateTime.now();
        //
        List<Poll> draftsToOpen = pollRepository.findDraftsToOpen(PollStatus.DRAFT, now);
        for (Poll poll : draftsToOpen) {
            poll.setStatus(PollStatus.OPEN);
            pollRepository.save(poll);
        }
        //
        List<Poll> opensToClose = pollRepository.findOpensToClose(PollStatus.OPEN, now);
        for (Poll poll : opensToClose) {
            poll.setStatus(PollStatus.CLOSED);
            pollRepository.save(poll);
        }
    }
}
