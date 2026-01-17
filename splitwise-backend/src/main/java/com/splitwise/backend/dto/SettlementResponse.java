package com.splitwise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SettlementResponse {
    private String id;
    private String groupId;
    private String fromUserId;
    private String toUserId;
    private double amount;
    private Instant createdAt;
}
