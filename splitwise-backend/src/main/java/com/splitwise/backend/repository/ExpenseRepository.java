package com.splitwise.backend.repository;

import com.splitwise.backend.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByGroupIdOrderByIdDesc(String groupId);
}
