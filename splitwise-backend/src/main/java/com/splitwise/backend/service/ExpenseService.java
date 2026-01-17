package com.splitwise.backend.service;

import com.splitwise.backend.dto.*;
import com.splitwise.backend.exception.InvalidSplitException;
import com.splitwise.backend.exception.ResourceNotFoundException;
import com.splitwise.backend.exception.UserNotInGroupException;
import com.splitwise.backend.model.*;
import com.splitwise.backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class ExpenseService {

    private final GroupService groupService;
    private final UserService userService;
    private final BalanceRepository balanceRepository;
    private final GroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupBalanceAggRepository groupBalanceAggRepository;
    private final SettlementRepository settlementRepository;

    public ExpenseService(
            GroupService groupService,
            UserService userService,
            BalanceRepository balanceRepository,
            GroupRepository groupRepository,
            ExpenseRepository expenseRepository,
            GroupBalanceAggRepository groupBalanceAggRepository,
            SettlementRepository settlementRepository
    ) {
        this.groupService = groupService;
        this.userService = userService;
        this.balanceRepository = balanceRepository;
        this.groupRepository = groupRepository;
        this.expenseRepository = expenseRepository;
        this.groupBalanceAggRepository = groupBalanceAggRepository;
        this.settlementRepository = settlementRepository;
    }

    // ================= CREATE EXPENSE =================

    public Expense addExpense(CreateExpenseRequest request) {

        // Identify caller (JWT user)
        User currentUser = userService.getCurrentUser();

        // Authorization check (caller must be in group)
        Group group = groupService.getGroup(request.getGroupId());

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        validateGroupExpense(request);

        // 1️⃣ Create and persist Expense FIRST
        Expense expense = new Expense();
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setSplitType(request.getSplitType());
        expense.setGroup(groupService.getGroup(request.getGroupId()));
        expense.setPaidBy(userService.getUserById(request.getPaidByUserId()));

        expenseRepository.save(expense);

        // 2️⃣ Apply split logic with expenseId
        switch (request.getSplitType()) {
            case EQUAL -> handleEqualSplit(request, expense.getId());
            case EXACT -> handleExactSplit(request, expense.getId());
            case PERCENTAGE -> handlePercentageSplit(request, expense.getId());
        }

        return expense;
    }

    // ================= VALIDATION =================

    private void validateGroupExpense(CreateExpenseRequest request) {
        Group group = groupService.getGroup(request.getGroupId());

        boolean payerInGroup = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(request.getPaidByUserId()));

        if (!payerInGroup) {
            throw new UserNotInGroupException(request.getPaidByUserId());
        }

        for (String participantId : request.getParticipantUserIds()) {
            boolean present = group.getMembers().stream()
                    .anyMatch(u -> u.getId().equals(participantId));
            if (!present) {
                throw new UserNotInGroupException(participantId);
            }
        }
    }

    // ================= SPLIT HANDLERS =================

    private void handleEqualSplit(CreateExpenseRequest request, String expenseId) {
        double share = request.getAmount() / request.getParticipantUserIds().size();

        for (String userId : request.getParticipantUserIds()) {
            if (!userId.equals(request.getPaidByUserId())) {
                createBalance(
                        request.getGroupId(),
                        userId,
                        request.getPaidByUserId(),
                        share,
                        expenseId
                );
            }
        }
    }

    private void handleExactSplit(CreateExpenseRequest request, String expenseId) {
        double total = request.getSplitDetails().values()
                .stream().mapToDouble(Double::doubleValue).sum();

        if (Double.compare(total, request.getAmount()) != 0) {
            throw new InvalidSplitException("Exact split total must equal expense amount");
        }

        request.getSplitDetails().forEach((userId, amount) -> {
            if (!userId.equals(request.getPaidByUserId())) {
                createBalance(
                        request.getGroupId(),
                        userId,
                        request.getPaidByUserId(),
                        amount,
                        expenseId
                );
            }
        });
    }

    private void handlePercentageSplit(CreateExpenseRequest request, String expenseId) {
        double total = request.getSplitDetails().values()
                .stream().mapToDouble(Double::doubleValue).sum();

        if (Double.compare(total, 100.0) != 0) {
            throw new InvalidSplitException("Percentage split total must be 100");
        }

        request.getSplitDetails().forEach((userId, percent) -> {
            if (!userId.equals(request.getPaidByUserId())) {
                double amount = request.getAmount() * percent / 100;
                createBalance(
                        request.getGroupId(),
                        userId,
                        request.getPaidByUserId(),
                        amount,
                        expenseId
                );
            }
        });
    }

    // ================= BALANCE CREATION =================

    private void createBalance(String groupId, String fromUserId, String toUserId, double amount, String expenseId) {
        // Save balance in balances table
        Balance balance = new Balance();
        balance.setExpenseId(expenseId);
        balance.setGroup(groupService.getGroup(groupId));
        balance.setFromUser(userService.getUserById(fromUserId));
        balance.setToUser(userService.getUserById(toUserId));
        balance.setAmount(amount);
        balanceRepository.save(balance);

        // Update the group_balances_agg table
        upsertAggregateBalance(groupId, fromUserId, toUserId, amount);
    }

    private void upsertAggregateBalance(String groupId, String fromUserId, String toUserId, double delta) {
        // Don’t store self edges
        if (fromUserId.equals(toUserId)) {
            return;
        }

        var existingOpt = groupBalanceAggRepository
                .findByGroupIdAndFromUserIdAndToUserId(groupId, fromUserId, toUserId);

        if (existingOpt.isPresent()) {
            GroupBalanceAgg existing = existingOpt.get();
            existing.setAmount(existing.getAmount() + delta);

            // if it becomes 0 or negative, clean it
            if (existing.getAmount() <= 0.000001) {
                groupBalanceAggRepository.delete(existing);
            } else {
                groupBalanceAggRepository.save(existing);
            }
        } else {
            // create only if positive delta
            if (delta <= 0.000001) {
                return;
            }

            GroupBalanceAgg agg = new GroupBalanceAgg();
            agg.setGroup(groupService.getGroup(groupId));
            agg.setFromUser(userService.getUserById(fromUserId));
            agg.setToUser(userService.getUserById(toUserId));
            agg.setAmount(delta);

            System.out.println("Agg : " + agg);

            groupBalanceAggRepository.save(agg);
        }
    }

    // ================= READ BALANCES =================

    public List<BalanceResponse> getBalances(String groupId) {

        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }

        List<GroupBalanceAgg> balances = groupBalanceAggRepository.findByGroupId(groupId);

        return balances.stream()
                .filter(b -> b.getAmount() > 0)
                .map(b -> new BalanceResponse(
                        b.getFromUser().getId(),
                        b.getToUser().getId(),
                        b.getAmount()
                ))
                .toList();
    }

    // ================= SETTLEMENT =================

    public List<SettlementDTO> settleUp(String groupId) {

        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }

        List<GroupBalanceAgg> balances = groupBalanceAggRepository.findByGroupId(groupId);
        Map<String, Double> net = new HashMap<>();

        for (GroupBalanceAgg b : balances) {
            net.put(b.getFromUser().getId(),
                    net.getOrDefault(b.getFromUser().getId(), 0.0) - b.getAmount());
            net.put(b.getToUser().getId(),
                    net.getOrDefault(b.getToUser().getId(), 0.0) + b.getAmount());
        }

        Queue<Map.Entry<String, Double>> debtors = new ArrayDeque<>();
        Queue<Map.Entry<String, Double>> creditors = new ArrayDeque<>();

        net.forEach((userId, amount) -> {
            if (amount < 0) debtors.add(Map.entry(userId, amount));
            else if (amount > 0) creditors.add(Map.entry(userId, amount));
        });

        List<SettlementDTO> settlements = new ArrayList<>();

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            var debtor = debtors.poll();
            var creditor = creditors.poll();

            double settleAmount = Math.min(-debtor.getValue(), creditor.getValue());

            settlements.add(new SettlementDTO(
                    debtor.getKey(),
                    creditor.getKey(),
                    settleAmount
            ));

            if (debtor.getValue() + settleAmount < 0) {
                debtors.add(Map.entry(debtor.getKey(), debtor.getValue() + settleAmount));
            }
            if (creditor.getValue() - settleAmount > 0) {
                creditors.add(Map.entry(creditor.getKey(), creditor.getValue() - settleAmount));
            }
        }

        return settlements;
    }

    // ================= DELETE / UPDATE =================

    private void reverseExpenseImpact(String expenseId) {
        List<Balance> expenseBalances = balanceRepository.findByExpenseId(expenseId);

        // Reverse impact from aggregate table
        for (Balance b : expenseBalances) {
            upsertAggregateBalance(
                    b.getGroup().getId(),
                    b.getFromUser().getId(),
                    b.getToUser().getId(),
                    -b.getAmount()
            );
        }

        // Delete ledger rows
        balanceRepository.deleteAll(expenseBalances);
    }

    public void deleteExpense(String groupId, String expenseId) {

        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        if (!expense.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Expense does not belong to group");
        }

        reverseExpenseImpact(expenseId);
        expenseRepository.delete(expense);
    }

    @Transactional
    public Expense updateExpense(String groupId, String expenseId, UpdateExpenseRequest request) {

        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        Expense existing = expenseRepository.findById(expenseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Expense not found"));

        if (!existing.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Expense does not belong to group");
        }

        // 1️⃣ Reverse balances
        reverseExpenseImpact(expenseId);

        // 2️⃣ Delete expense SAFELY
        expenseRepository.deleteById(expenseId);
        expenseRepository.flush();   // 🔑 prevents stale entity

        // 3️⃣ Recreate expense
        CreateExpenseRequest newRequest = new CreateExpenseRequest();
        newRequest.setGroupId(groupId);
        newRequest.setDescription(request.getDescription());
        newRequest.setAmount(request.getAmount());
        newRequest.setPaidByUserId(request.getPaidByUserId());
        newRequest.setParticipantUserIds(request.getParticipantUserIds());
        newRequest.setSplitType(request.getSplitType());
        newRequest.setSplitDetails(request.getSplitDetails());

        return addExpense(newRequest);
    }

    public List<ExpenseResponse> getExpensesByGroup(String groupId) {

        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(currentUser)) {
            throw new UserNotInGroupException(currentUser.getId());
        }

        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }

        List<Expense> expenses =
                expenseRepository.findByGroupIdOrderByIdDesc(groupId);

        List<ExpenseResponse> response = new ArrayList<>();

        for (Expense expense : expenses) {

            List<Balance> balances =
                    balanceRepository.findByExpenseId(expense.getId());

            Set<String> participants = new HashSet<>();
            Map<String, Double> splitDetails = new HashMap<>();

            for (Balance b : balances) {
                participants.add(b.getFromUser().getId());

                // For EXACT & PERCENTAGE → return amount owed
                if (expense.getSplitType() != SplitType.EQUAL) {
                    splitDetails.merge(
                            b.getFromUser().getId(),
                            b.getAmount(),
                            Double::sum
                    );
                }
            }

            // PaidBy is always a participant
            participants.add(expense.getPaidBy().getId());

            response.add(
                    new ExpenseResponse(
                            expense.getId(),
                            expense.getDescription(),
                            expense.getAmount(),
                            expense.getSplitType(),
                            expense.getPaidBy().getId(),
                            new ArrayList<>(participants),
                            expense.getSplitType() == SplitType.EQUAL ? null : splitDetails,
                            expense.getCreatedAt(),
                            expense.getUpdatedAt()
                    )
            );
        }

        return response;
    }

    public ExpenseResponse getExpenseById(String groupId, String expenseId){
        User user = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);

        if (!group.getMembers().contains(user)) {
            throw new UserNotInGroupException(user.getId());
        }

        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Expense not found"));

        if (!expense.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Expense does not belong to group");
        }

        List<Balance> balances =
                balanceRepository.findByExpenseId(expense.getId());

        Set<String> participants = new HashSet<>();
        Map<String, Double> splitDetails = new HashMap<>();

        for (Balance b : balances) {
            participants.add(b.getFromUser().getId());

            // For EXACT & PERCENTAGE → return amount owed
            if (expense.getSplitType() != SplitType.EQUAL) {
                splitDetails.merge(
                        b.getFromUser().getId(),
                        b.getAmount(),
                        Double::sum
                );
            }
        }

        // PaidBy is always a participant
        participants.add(expense.getPaidBy().getId());

        return new ExpenseResponse(
            expense.getId(),
            expense.getDescription(),
            expense.getAmount(),
            expense.getSplitType(),
            expense.getPaidBy().getId(),
            new ArrayList<>(participants),
            expense.getSplitType() == SplitType.EQUAL ? null : splitDetails,
            expense.getCreatedAt(),
            expense.getUpdatedAt()
        );
    }

    @Transactional
    public SettlementResponse settleViaBalance(String groupId, SettlementDTO settlementDTO){
        if (settlementDTO.getAmount() <= 0) {
            throw new RuntimeException("Settlement amount must be greater than 0");
        }

        Group group = groupService.getGroup(groupId);

        // Validate users exist + are group members
        User fromUser = userService.getUserById(settlementDTO.getFromUserId());
        User toUser = userService.getUserById(settlementDTO.getToUserId());

        if (!group.getMembers().contains(fromUser)) {
            throw new UserNotInGroupException(fromUser.getId());
        }

        if (!group.getMembers().contains(toUser)) {
            throw new UserNotInGroupException(toUser.getId());
        }

        GroupBalanceAgg aggBalance = groupBalanceAggRepository
                .findByGroupIdAndFromUserIdAndToUserId(groupId, fromUser.getId(), toUser.getId())
                .orElseThrow(() -> new RuntimeException("No balance exists between these users"));

        System.out.println(aggBalance.getAmount());
        if (aggBalance.getAmount() + 0.000001 < settlementDTO.getAmount()) {
            throw new RuntimeException("Settlement amount exceeds due amount");
        }
        // Update aggregated balance
        double remaining = aggBalance.getAmount() - settlementDTO.getAmount();

        if (remaining <= 0.000001) {
            groupBalanceAggRepository.delete(aggBalance);
        } else {
            aggBalance.setAmount(remaining);
            groupBalanceAggRepository.save(aggBalance);
        }

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setToUser(toUser);
        settlement.setFromUser(fromUser);
        settlement.setAmount(settlementDTO.getAmount());
        settlement.setCreatedAt(Instant.now());

        System.out.println("Settlement " + settlement);

        Settlement settled = settlementRepository.save(settlement);

        System.out.println("Settled " + settled);

        return new SettlementResponse(
                settled.getId(),
                group.getId(),
                fromUser.getId(),
                toUser.getId(),
                settled.getAmount(),
                settled.getCreatedAt()
        );
    }

    @Transactional
    public SettlementResponse settleViaSettle(String groupId, SettlementDTO settlementDTO){
        if (settlementDTO.getAmount() <= 0) {
            throw new RuntimeException("Settlement amount must be greater than 0");
        }

        Group group = groupService.getGroup(groupId);

        // Validate users exist + are group members
        User fromUser = userService.getUserById(settlementDTO.getFromUserId());
        User toUser = userService.getUserById(settlementDTO.getToUserId());

        System.out.println("From : " + fromUser.getId());
        System.out.println("To : " + toUser.getId());

        if (!group.getMembers().contains(fromUser)) {
            throw new UserNotInGroupException(fromUser.getId());
        }

        if (!group.getMembers().contains(toUser)) {
            throw new UserNotInGroupException(toUser.getId());
        }

        double amountToSettle = settlementDTO.getAmount();

        upsertAggregateBalance(group.getId(), toUser.getId(), fromUser.getId(), amountToSettle);

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setToUser(toUser);
        settlement.setFromUser(fromUser);
        settlement.setAmount(amountToSettle);
        settlement.setCreatedAt(Instant.now());

        System.out.println("Settlement " + settlement);

        Settlement settled = settlementRepository.save(settlement);

        System.out.println("Settled " + settled);

        return new SettlementResponse(
                settled.getId(),
                group.getId(),
                fromUser.getId(),
                toUser.getId(),
                settled.getAmount(),
                settled.getCreatedAt()
        );
    }
}
