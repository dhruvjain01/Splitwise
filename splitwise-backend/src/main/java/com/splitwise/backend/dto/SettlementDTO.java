package com.splitwise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SettlementDTO {
    private String fromUserId;
    private String toUserId;
    private double amount;
}
