package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.*;

@Data
public class UpdateExpenseRequest {

    @NotBlank
    private String description;

    @Positive
    private double amount;

    @NotBlank
    private String paidByUserId;

    @NotEmpty
    private List<String> participantUserIds;

    @NotNull
    private SplitType splitType;

    private Map<String, Double> splitDetails;
}

