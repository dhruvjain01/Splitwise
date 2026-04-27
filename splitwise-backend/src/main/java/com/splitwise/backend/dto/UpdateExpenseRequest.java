package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.*;

@Data
public class UpdateExpenseRequest {

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotBlank
    private String paidByUserId;

    @NotEmpty
    private List<String> participantUserIds;

    @NotNull
    private SplitType splitType;

    private Map<String, BigDecimal> splitDetails;
}
