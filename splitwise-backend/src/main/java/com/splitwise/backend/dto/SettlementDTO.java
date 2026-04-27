package com.splitwise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SettlementDTO {
    @NotBlank
    private String fromUserId;
    @NotBlank
    private String toUserId;
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;
}
