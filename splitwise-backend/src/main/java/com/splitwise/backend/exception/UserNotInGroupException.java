package com.splitwise.backend.exception;

public class UserNotInGroupException extends RuntimeException {
    public UserNotInGroupException(String userId) {
        super("User is not a member of the group: " + userId);
    }
}
