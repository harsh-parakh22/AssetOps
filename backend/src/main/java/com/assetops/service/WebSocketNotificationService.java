package com.assetops.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(String userId, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", payload);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }

    public void broadcast(String destination, Object payload) {
        messagingTemplate.convertAndSend("/topic/" + destination, payload);
    }
}
