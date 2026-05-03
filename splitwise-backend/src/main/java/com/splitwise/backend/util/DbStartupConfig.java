package com.splitwise.backend.util;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class DbStartupConfig {
    @Bean
    public ApplicationRunner waitForDb(DataSource dataSource) {
        return args -> {
            int retries = 10;
            while (retries-- > 0) {
                try (Connection conn = dataSource.getConnection()) {
                    return;
                } catch (Exception e) {
                    Thread.sleep(5000);
                }
            }
            throw new RuntimeException("DB not available after retries");
        };
    }
}
