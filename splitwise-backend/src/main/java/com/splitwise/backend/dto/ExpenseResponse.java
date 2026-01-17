package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class ExpenseResponse {

    private String id;
    private String description;
    private double amount;
    private SplitType splitType;
    private String paidByUserId;
    private List<String> participantUserIds;
    private Map<String, Double> splitDetails;
    private Instant createdAt;
    private Instant updatedAt;
}
