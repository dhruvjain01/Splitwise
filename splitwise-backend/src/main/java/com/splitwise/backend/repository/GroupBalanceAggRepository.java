package com.splitwise.backend.repository;

import com.splitwise.backend.model.GroupBalanceAgg;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupBalanceAggRepository extends JpaRepository<GroupBalanceAgg, Long> {
    Optional<GroupBalanceAgg> findByGroupIdAndFromUserIdAndToUserId(
            String groupId,
            String fromUserId,
            String toUserId
    );

    List<GroupBalanceAgg> findByGroupId(String groupId);
}
