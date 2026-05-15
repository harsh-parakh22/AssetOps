package com.assetops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = { RedisRepositoriesAutoConfiguration.class })
@EnableCaching
@EnableKafka
@EnableAsync
@EnableScheduling
public class AssetOpsApplication {
    public static void main(String[] args) {
        SpringApplication.run(AssetOpsApplication.class, args);
    }
}
