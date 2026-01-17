package com.splitwise.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddGroupMemberRequest {
    @NotBlank
    private String email;
}
