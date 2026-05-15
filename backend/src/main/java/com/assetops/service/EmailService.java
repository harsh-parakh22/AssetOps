package com.assetops.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {
    @Async
    public void sendNotificationEmail(String to, String subject, String body) {
        log.info("[EMAIL] To={} Subject={}", to, subject);
    }
}
