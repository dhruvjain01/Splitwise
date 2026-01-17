package com.splitwise.backend.repository;

import com.splitwise.backend.model.Group;
import com.splitwise.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, String> {
    List<Group> findByMembersContaining(User user);
}

