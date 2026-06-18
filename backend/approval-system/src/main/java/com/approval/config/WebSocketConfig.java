package com.approval.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // prefix cho các client subscribe nhận tin: /topic, /queue (cho cá nhân)
        config.enableSimpleBroker("/topic", "/queue");
        // prefix cho các message gửi từ client lên backend: /app
        config.setApplicationDestinationPrefixes("/app");
        // Chỉ định tiền tố cho tin nhắn cá nhân: /user
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint để client kết nối STOMP qua WebSocket, cho phép mọi nguồn CORS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
                // .withSockJS(); // Bỏ qua SockJS để tránh lỗi thư viện phức tạp ở frontend
    }
}
