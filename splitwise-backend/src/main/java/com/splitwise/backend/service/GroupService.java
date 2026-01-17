package com.splitwise.backend.service;

import com.splitwise.backend.exception.ResourceNotFoundException;
import com.splitwise.backend.exception.UserAlreadyInGroupException;
import com.splitwise.backend.exception.UserNotFoundException;
import com.splitwise.backend.exception.UserNotInGroupException;
import com.splitwise.backend.model.Group;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.GroupRepository;
import com.splitwise.backend.repository.UserRepository;
import com.splitwise.backend.util.CurrentUserContext;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public GroupService(GroupRepository groupRepository, UserRepository userRepository, UserService userService) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public Group createGroup(String name) {
//        Group group = new Group();
//        group.setName(name);
//        System.out.println("Group Details" + group);
//        Group newGroup = groupRepository.save(group);
//        System.out.println("New Group Details" + newGroup);
//
//        User user = userRepository.findById(
//                Objects.requireNonNull(CurrentUserContext.getUserId())
//        ).orElseThrow(() -> new RuntimeException("Unauthenticated"));
//
//
//
//        System.out.println("User " + user);
//        group.getMembers().add(user);
//        groupRepository.save(newGroup);
//        System.out.println("New Group Details" + newGroup);
//        return newGroup;

        String userId = Objects.requireNonNull(
                CurrentUserContext.getUserId(),
                "Unauthenticated"
        );

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Unauthenticated"));

        Group group = new Group();
        group.setName(name);
        group.getMembers().add(user);

        return groupRepository.save(group);
    }

    public Group getGroup(String id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));
    }

    public void addMember(String groupId, String email) {
        // 🔐 Identify caller
        User currentUser = userRepository.findByEmail(
                CurrentUserContext.getEmail()
        ).orElseThrow(() -> new RuntimeException("Unauthenticated"));

        Group group = getGroup(groupId);

        // 🔒 Authorization: caller must be in group
        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        if (group.getMembers().contains(user)) {
            throw new UserAlreadyInGroupException(email);
        }

        group.getMembers().add(user);
        groupRepository.save(group);
    }

    public List<Group> getAllGroups() {
        User currentUser = userService.getCurrentUser();
        return groupRepository.findByMembersContaining(currentUser);
    }

    public List<User> getMembers(String groupId) {
        User currentUser = userService.getCurrentUser();
        Group group = getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }
        return new ArrayList<>(group.getMembers());
    }
}

