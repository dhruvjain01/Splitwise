package com.splitwise.backend.exception;

import com.splitwise.backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ================= 404 NOT FOUND =================

    @ExceptionHandler({ResourceNotFoundException.class, UserNotFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNotFound(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    // ================= 409 CONFLICT =================

    @ExceptionHandler({UserAlreadyInGroupException.class, DuplicateEmailException.class})
    public ResponseEntity<ApiResponse<Void>> handleConflict(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    // ================= 400 BAD REQUEST =================

    @ExceptionHandler({InvalidSplitException.class, UserNotInGroupException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .orElse("Validation failed");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(message, null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    @ExceptionHandler(UserNotVerified.class)
    public ResponseEntity<ApiResponse<Void>> userNotVerified(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(ex.getMessage(), null));
    }

    // ================= 500 INTERNAL ERROR =================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        // Optional: log ex
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("Internal server error", null));
    }
}
