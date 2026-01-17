package com.splitwise.backend.controller;

import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.BalanceResponse;
import com.splitwise.backend.dto.SettlementDTO;
import com.splitwise.backend.dto.SettlementResponse;
import com.splitwise.backend.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups/{groupId}/balances")
public class BalanceController {
    private final ExpenseService expenseService;

    public BalanceController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BalanceResponse>>> getBalances(@PathVariable String groupId) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "Balances fetched successfully",
                        expenseService.getBalances(groupId)
                )
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SettlementResponse>> settle(@PathVariable String groupId, @RequestBody SettlementDTO request) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "Amount Settled Successfully",
                        expenseService.settleViaBalance(groupId, request)
                )
        );
    }
}
