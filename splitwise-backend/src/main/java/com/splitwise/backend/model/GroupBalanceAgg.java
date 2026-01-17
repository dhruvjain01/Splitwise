package com.splitwise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "group_balances_agg",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "from_user_id", "to_user_id"})
)
@NoArgsConstructor
@AllArgsConstructor
@Data
public class GroupBalanceAgg
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(optional = false)
    @JoinColumn(name = "to_user_id")
    private User toUser;

    @Column(nullable = false)
    private double amount;
}
