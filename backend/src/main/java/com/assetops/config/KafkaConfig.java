package com.assetops.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@SuppressWarnings("null")
public class KafkaConfig {

    @Value("${app.kafka.topics.asset-events}")
    private String assetEventsTopic;

    @Value("${app.kafka.topics.request-events}")
    private String requestEventsTopic;

    @Value("${app.kafka.topics.notification-events}")
    private String notificationEventsTopic;

    @Value("${app.kafka.topics.audit-events}")
    private String auditEventsTopic;

    @Bean
    public NewTopic assetEventsTopic() {
        return TopicBuilder.name(assetEventsTopic)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic requestEventsTopic() {
        return TopicBuilder.name(requestEventsTopic)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name(notificationEventsTopic)
            .partitions(6)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic auditEventsTopic() {
        return TopicBuilder.name(auditEventsTopic)
            .partitions(3)
            .replicas(1)
            .build();
    }
}
