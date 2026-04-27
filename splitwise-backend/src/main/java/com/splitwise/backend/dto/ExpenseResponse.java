package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class ExpenseResponse {

    private String id;
    private String description;
    private BigDecimal amount;
    private SplitType splitType;
    private String paidByUserId;
    private List<String> participantUserIds;
    private Map<String, BigDecimal> splitDetails;
    private Instant createdAt;
    private Instant updatedAt;
}
