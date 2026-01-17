package com.splitwise.backend.model;

import jakarta.persistence.*;
import lombok.*;

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

    private double amount;
}

