package com.assetops.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;


/**
 * Intercepts STOMP CONNECT frames and validates the JWT token
 * from the "Authorization" header sent by the client.
 * This is needed because the HTTP security filter chain does not apply
 * to the WebSocket upgrade request after we permitted /ws.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT without valid Authorization header");
            return message;
        }

        String token = authHeader.substring(7);
        try {
            if (jwtService.isTokenValid(token)) {
                String email = jwtService.extractEmail(token);
                if (email != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(auth);
                    log.debug("WebSocket authenticated user: {}", email);
                }
            }
        } catch (Exception e) {
            log.warn("WebSocket JWT validation failed: {}", e.getMessage());
        }

        return message;
    }
}
