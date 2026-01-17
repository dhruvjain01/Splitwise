package com.splitwise.backend.controller;

import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.CreateExpenseRequest;
import com.splitwise.backend.dto.ExpenseResponse;
import com.splitwise.backend.dto.UpdateExpenseRequest;
import com.splitwise.backend.model.Expense;
import com.splitwise.backend.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> addExpense(@PathVariable String groupId, @RequestBody CreateExpenseRequest request) {
        request.setGroupId(groupId);

        Expense expense = expenseService.addExpense(request);

        ExpenseResponse responseDto = new ExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getSplitType(),
                expense.getPaidBy().getId(),
                request.getParticipantUserIds(),
                request.getSplitDetails(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );

        ApiResponse<ExpenseResponse> response = new ApiResponse<>(
                "Expense created successfully",
                responseDto
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable String groupId, @PathVariable String expenseId) {
        expenseService.deleteExpense(groupId, expenseId);
        return ResponseEntity.ok(new ApiResponse<>("Expense deleted successfully", null));
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(@PathVariable String groupId, @PathVariable String expenseId, @RequestBody UpdateExpenseRequest request) {
        Expense expense = expenseService.updateExpense(groupId, expenseId, request);
        ExpenseResponse responseDto = new ExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getSplitType(),
                expense.getPaidBy().getId(),
                request.getParticipantUserIds(),
                request.getSplitDetails(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );

        return ResponseEntity.ok(
                new ApiResponse<>("Expense updated successfully", responseDto)
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getExpenses(@PathVariable String groupId) {
        List<ExpenseResponse> expenses =
                expenseService.getExpensesByGroup(groupId);

        ApiResponse<List<ExpenseResponse>> response =
                new ApiResponse<>("Expenses fetched successfully", expenses);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpenseById(@PathVariable String groupId, @PathVariable String expenseId) {
        ExpenseResponse expense = expenseService.getExpenseById(groupId,expenseId);

        ApiResponse<ExpenseResponse> response =
                new ApiResponse<>("Expense fetched successfully", expense);

        return ResponseEntity.ok(response);
    }

}
