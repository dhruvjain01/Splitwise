package com.splitwise.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "settlements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Settlement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(optional = false)
    @JoinColumn(name = "to_user_id")
    private User toUser;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant createdAt;
}
