package com.splitwise.backend.controller;

import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.SettlementDTO;
import com.splitwise.backend.dto.SettlementResponse;
import com.splitwise.backend.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/settle")
public class SettlementController {
    private final ExpenseService expenseService;

    public SettlementController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SettlementDTO>>> settle(@PathVariable String groupId) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "Settlement calculated successfully",
                        expenseService.settleUp(groupId)
                )
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SettlementResponse>> settlePayment(@PathVariable String groupId, @RequestBody SettlementDTO request) {
        System.out.println("CHECK");
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "Payment Settled Successfully",
                        expenseService.settleViaSettle(groupId, request)
                )
        );
    }
}
