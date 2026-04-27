package com.splitwise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class BalanceResponse {
    private String fromUserId;
    private String toUserId;
    private BigDecimal amount;
}
