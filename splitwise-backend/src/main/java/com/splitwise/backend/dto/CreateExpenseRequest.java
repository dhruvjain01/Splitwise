package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import jakarta.persistence.Column;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CreateExpenseRequest {

    @NotBlank
    private String groupId;

    @NotBlank
    private String description;

    @NotBlank
    private String paidByUserId;

    @Positive
    private double amount;

    @NotEmpty
    private List<String> participantUserIds;

    @NotNull
    private SplitType splitType;

    private Map<String, Double> splitDetails;
}
