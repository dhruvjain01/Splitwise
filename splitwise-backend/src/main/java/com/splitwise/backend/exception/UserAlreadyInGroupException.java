package com.splitwise.backend.exception;

public class UserAlreadyInGroupException extends RuntimeException {
    public UserAlreadyInGroupException(String email) {
        super("User already exists in group: " + email);
    }
}
