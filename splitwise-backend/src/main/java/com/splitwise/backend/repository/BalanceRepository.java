package com.splitwise.backend.repository;

import com.splitwise.backend.model.Balance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface BalanceRepository extends JpaRepository<Balance, Long> {
    Optional<Balance> findByGroupIdAndFromUserIdAndToUserId(
            String groupId,
            String fromUserId,
            String toUserId
    );
    List<Balance> findByGroupId(String groupId);
    List<Balance> findByExpenseId(String expenseId);
}
