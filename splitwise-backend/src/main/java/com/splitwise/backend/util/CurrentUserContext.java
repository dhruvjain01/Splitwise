package com.splitwise.backend.util;

import com.splitwise.backend.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class CurrentUserContext {
    public static User getUser() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        return null;
    }

    public static String getEmail() {
        User user = getUser();
        return user != null ? user.getEmail() : null;
    }

    public static String getUserId() {
        User user = getUser();
        return user != null ? user.getId() : null;
    }
}
