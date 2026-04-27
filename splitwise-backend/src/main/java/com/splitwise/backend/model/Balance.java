package com.splitwise.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "balances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Balance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String expenseId;

    @ManyToOne
    private Group group;

    @ManyToOne
    private User fromUser;

    @ManyToOne
    private User toUser;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal amount;
}
