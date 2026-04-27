package com.splitwise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
public class SettlementResponse {
    private String id;
    private String groupId;
    private String fromUserId;
    private String toUserId;
    private BigDecimal amount;
    private Instant createdAt;
}
