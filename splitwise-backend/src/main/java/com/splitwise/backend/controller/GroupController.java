package com.splitwise.backend.controller;

import com.splitwise.backend.dto.AddGroupMemberRequest;
import com.splitwise.backend.dto.ApiResponse;
import com.splitwise.backend.dto.CreateGroupRequest;
import com.splitwise.backend.model.Group;
import com.splitwise.backend.model.User;
import com.splitwise.backend.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;

@RestController
@RequestMapping("api/groups")
public class GroupController {
    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Group>> createGroup(@RequestBody CreateGroupRequest request) {
        Group group = groupService.createGroup(request.getName());

        ApiResponse<Group> response = new ApiResponse<>(
                "Group created successfully",
                group
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<Void>> addMember(@PathVariable String groupId, @RequestBody AddGroupMemberRequest request) {
        groupService.addMember(groupId, request.getEmail());

        ApiResponse<Void> response = new ApiResponse<>(
                "Member added to group successfully",
                null
        );

        return ResponseEntity.ok(response);
    }


    @GetMapping
    public ResponseEntity<ApiResponse<List<Group>>> getGroups() {
        List<Group> groups = groupService.getAllGroups();

        ApiResponse<List<Group>> response = new ApiResponse<>(
                "Groups fetched successfully",
                groups
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<List<User>>> getMembers(@PathVariable String groupId) {
        List<User> members = groupService.getMembers(groupId);

        ApiResponse<List<User>> response = new ApiResponse<>(
                "Group members fetched successfully",
                members
        );

        return ResponseEntity.ok(response);
    }
}
