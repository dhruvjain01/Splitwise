package com.splitwise.backend.dto;

import com.splitwise.backend.model.SplitType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class CreateExpenseRequest {

//    @NotBlank
    private String groupId;

    @NotBlank
    private String description;

    @NotBlank
    private String paidByUserId;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotEmpty
    private List<String> participantUserIds;

    @NotNull
    private SplitType splitType;

    private Map<String, BigDecimal> splitDetails;
}
