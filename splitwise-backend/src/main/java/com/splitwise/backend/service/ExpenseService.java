package com.splitwise.backend.service;

import com.splitwise.backend.dto.BalanceResponse;
import com.splitwise.backend.dto.CreateExpenseRequest;
import com.splitwise.backend.dto.ExpenseResponse;
import com.splitwise.backend.dto.SettlementDTO;
import com.splitwise.backend.dto.SettlementResponse;
import com.splitwise.backend.dto.UpdateExpenseRequest;
import com.splitwise.backend.exception.InvalidSplitException;
import com.splitwise.backend.exception.ResourceNotFoundException;
import com.splitwise.backend.exception.UnauthorizedException;
import com.splitwise.backend.exception.UserNotInGroupException;
import com.splitwise.backend.model.Balance;
import com.splitwise.backend.model.Expense;
import com.splitwise.backend.model.Group;
import com.splitwise.backend.model.GroupBalanceAgg;
import com.splitwise.backend.model.Settlement;
import com.splitwise.backend.model.SplitType;
import com.splitwise.backend.model.User;
import com.splitwise.backend.repository.BalanceRepository;
import com.splitwise.backend.repository.ExpenseRepository;
import com.splitwise.backend.repository.GroupBalanceAggRepository;
import com.splitwise.backend.repository.SettlementRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;

@Service
@Transactional
public class ExpenseService {

    private static final int MONEY_SCALE = 6;
    private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(MONEY_SCALE, MONEY_ROUNDING);
    private static final BigDecimal HUNDRED = new BigDecimal("100").setScale(MONEY_SCALE, MONEY_ROUNDING);

    private final GroupService groupService;
    private final UserService userService;
    private final BalanceRepository balanceRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupBalanceAggRepository groupBalanceAggRepository;
    private final SettlementRepository settlementRepository;

    public ExpenseService(
            GroupService groupService,
            UserService userService,
            BalanceRepository balanceRepository,
            ExpenseRepository expenseRepository,
            GroupBalanceAggRepository groupBalanceAggRepository,
            SettlementRepository settlementRepository
    ) {
        this.groupService = groupService;
        this.userService = userService;
        this.balanceRepository = balanceRepository;
        this.expenseRepository = expenseRepository;
        this.groupBalanceAggRepository = groupBalanceAggRepository;
        this.settlementRepository = settlementRepository;
    }

    public Expense addExpense(CreateExpenseRequest request) {
        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(request.getGroupId());
        ensureCurrentUserInGroup(group, currentUser);
        validateGroupExpense(group, request);

        Expense expense = new Expense();
        expense.setDescription(request.getDescription());
        expense.setAmount(normalize(request.getAmount()));
        expense.setSplitType(request.getSplitType());
        expense.setGroup(group);
        expense.setPaidBy(userService.getUserById(request.getPaidByUserId()));
        expenseRepository.save(expense);

        switch (request.getSplitType()) {
            case EQUAL -> handleEqualSplit(request, expense.getId());
            case EXACT -> handleExactSplit(request, expense.getId());
            case PERCENTAGE -> handlePercentageSplit(request, expense.getId());
        }

        return expense;
    }

    private void validateGroupExpense(Group group, CreateExpenseRequest request) {
        Set<String> groupMemberIds = group.getMembers().stream().map(User::getId).collect(HashSet::new, HashSet::add, HashSet::addAll);

        if (!groupMemberIds.contains(request.getPaidByUserId())) {
            throw new UserNotInGroupException(request.getPaidByUserId());
        }

        Set<String> participantIds = new HashSet<>(request.getParticipantUserIds());
        if (participantIds.size() != request.getParticipantUserIds().size()) {
            throw new InvalidSplitException("participantUserIds must not contain duplicates");
        }

        if (!participantIds.contains(request.getPaidByUserId())) {
            throw new InvalidSplitException("paidByUserId must be included in participantUserIds");
        }

        for (String participantId : participantIds) {
            if (!groupMemberIds.contains(participantId)) {
                throw new UserNotInGroupException(participantId);
            }
        }

        Map<String, BigDecimal> splitDetails = request.getSplitDetails();

        if (request.getSplitType() == SplitType.EQUAL) {
            if (splitDetails != null && !splitDetails.isEmpty()) {
                throw new InvalidSplitException("splitDetails must be empty for EQUAL split");
            }
            return;
        }

        if (splitDetails == null || splitDetails.isEmpty()) {
            throw new InvalidSplitException("splitDetails is required for EXACT and PERCENTAGE splits");
        }

        if (!splitDetails.keySet().equals(participantIds)) {
            throw new InvalidSplitException("splitDetails keys must exactly match participantUserIds");
        }

        splitDetails.forEach((userId, value) -> {
            if (value == null) {
                throw new InvalidSplitException("splitDetails contains null for user " + userId);
            }
            if (value.compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidSplitException("splitDetails cannot contain negative values");
            }
            if (request.getSplitType() == SplitType.PERCENTAGE && value.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new InvalidSplitException("Each percentage entry must be <= 100");
            }
        });
    }

    private void handleEqualSplit(CreateExpenseRequest request, String expenseId) {
        BigDecimal share = normalize(request.getAmount())
                .divide(BigDecimal.valueOf(request.getParticipantUserIds().size()), MONEY_SCALE, MONEY_ROUNDING);

        for (String userId : request.getParticipantUserIds()) {
            if (!userId.equals(request.getPaidByUserId())) {
                createBalance(request.getGroupId(), userId, request.getPaidByUserId(), share, expenseId);
            }
        }
    }

    private void handleExactSplit(CreateExpenseRequest request, String expenseId) {
        BigDecimal total = request.getSplitDetails().values().stream()
                .map(this::normalize)
                .reduce(ZERO, BigDecimal::add);

        if (total.compareTo(normalize(request.getAmount())) != 0) {
            throw new InvalidSplitException("Exact split total must equal expense amount");
        }

        request.getSplitDetails().forEach((userId, amount) -> {
            if (!userId.equals(request.getPaidByUserId())) {
                createBalance(request.getGroupId(), userId, request.getPaidByUserId(), normalize(amount), expenseId);
            }
        });
    }

    private void handlePercentageSplit(CreateExpenseRequest request, String expenseId) {
        BigDecimal total = request.getSplitDetails().values().stream()
                .map(this::normalize)
                .reduce(ZERO, BigDecimal::add);

        if (total.compareTo(HUNDRED) != 0) {
            throw new InvalidSplitException("Percentage split total must be 100");
        }

        request.getSplitDetails().forEach((userId, percent) -> {
            if (!userId.equals(request.getPaidByUserId())) {
                BigDecimal amount = normalize(request.getAmount())
                        .multiply(normalize(percent))
                        .divide(HUNDRED, MONEY_SCALE, MONEY_ROUNDING);
                createBalance(request.getGroupId(), userId, request.getPaidByUserId(), amount, expenseId);
            }
        });
    }

    private void createBalance(String groupId, String fromUserId, String toUserId, BigDecimal amount, String expenseId) {
        BigDecimal normalizedAmount = normalize(amount);
        if (normalizedAmount.compareTo(ZERO) <= 0) {
            return;
        }

        Balance balance = new Balance();
        balance.setExpenseId(expenseId);
        balance.setGroup(groupService.getGroup(groupId));
        balance.setFromUser(userService.getUserById(fromUserId));
        balance.setToUser(userService.getUserById(toUserId));
        balance.setAmount(normalizedAmount);
        balanceRepository.save(balance);

        upsertAggregateBalance(groupId, fromUserId, toUserId, normalizedAmount);
    }

    private void upsertAggregateBalance(String groupId, String fromUserId, String toUserId, BigDecimal delta) {
        BigDecimal normalizedDelta = normalize(delta);

        if (normalizedDelta.compareTo(ZERO) == 0 || fromUserId.equals(toUserId)) {
            return;
        }

        Optional<GroupBalanceAgg> forwardOpt = groupBalanceAggRepository
                .findByGroupIdAndFromUserIdAndToUserId(groupId, fromUserId, toUserId);
        Optional<GroupBalanceAgg> reverseOpt = groupBalanceAggRepository
                .findByGroupIdAndFromUserIdAndToUserId(groupId, toUserId, fromUserId);

        BigDecimal forward = forwardOpt.map(GroupBalanceAgg::getAmount).map(this::normalize).orElse(ZERO);
        BigDecimal reverse = reverseOpt.map(GroupBalanceAgg::getAmount).map(this::normalize).orElse(ZERO);

        BigDecimal net = forward.subtract(reverse).add(normalizedDelta);

        forwardOpt.ifPresent(groupBalanceAggRepository::delete);
        reverseOpt.ifPresent(groupBalanceAggRepository::delete);
        groupBalanceAggRepository.flush(); // ✅ force deletes to DB before inserting

        if (net.compareTo(ZERO) > 0) {
            GroupBalanceAgg agg = new GroupBalanceAgg();
            agg.setGroup(groupService.getGroup(groupId));
            agg.setFromUser(userService.getUserById(fromUserId));
            agg.setToUser(userService.getUserById(toUserId));
            agg.setAmount(normalize(net));
            groupBalanceAggRepository.save(agg);
        } else if (net.compareTo(ZERO) < 0) {
            GroupBalanceAgg agg = new GroupBalanceAgg();
            agg.setGroup(groupService.getGroup(groupId));
            agg.setFromUser(userService.getUserById(toUserId));
            agg.setToUser(userService.getUserById(fromUserId));
            agg.setAmount(normalize(net.abs()));
            groupBalanceAggRepository.save(agg);
        }
    }

    public List<BalanceResponse> getBalances(String groupId) {
        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);
        ensureCurrentUserInGroup(group, currentUser);

        List<GroupBalanceAgg> balances = groupBalanceAggRepository.findByGroupId(groupId);

        return balances.stream()
                .filter(b -> normalize(b.getAmount()).compareTo(ZERO) > 0)
                .map(b -> new BalanceResponse(
                        b.getFromUser().getId(),
                        b.getToUser().getId(),
                        normalize(b.getAmount())
                ))
                .toList();
    }

    public List<SettlementDTO> settleUp(String groupId) {
        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);
        ensureCurrentUserInGroup(group, currentUser);

        List<GroupBalanceAgg> balances = groupBalanceAggRepository.findByGroupId(groupId);
        Map<String, BigDecimal> net = new HashMap<>();

        for (GroupBalanceAgg balance : balances) {
            net.put(balance.getFromUser().getId(),
                    net.getOrDefault(balance.getFromUser().getId(), ZERO).subtract(normalize(balance.getAmount())));
            net.put(balance.getToUser().getId(),
                    net.getOrDefault(balance.getToUser().getId(), ZERO).add(normalize(balance.getAmount())));
        }

        Queue<Map.Entry<String, BigDecimal>> debtors = new ArrayDeque<>();
        Queue<Map.Entry<String, BigDecimal>> creditors = new ArrayDeque<>();

        net.forEach((userId, amount) -> {
            if (amount.compareTo(ZERO) < 0) {
                debtors.add(Map.entry(userId, amount));
            } else if (amount.compareTo(ZERO) > 0) {
                creditors.add(Map.entry(userId, amount));
            }
        });

        List<SettlementDTO> settlements = new ArrayList<>();

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            Map.Entry<String, BigDecimal> debtor = debtors.poll();
            Map.Entry<String, BigDecimal> creditor = creditors.poll();

            BigDecimal settleAmount = debtor.getValue().abs().min(creditor.getValue());

            settlements.add(new SettlementDTO(
                    debtor.getKey(),
                    creditor.getKey(),
                    normalize(settleAmount)
            ));

            BigDecimal remainingDebtor = debtor.getValue().add(settleAmount);
            BigDecimal remainingCreditor = creditor.getValue().subtract(settleAmount);

            if (remainingDebtor.compareTo(ZERO) < 0) {
                debtors.add(Map.entry(debtor.getKey(), normalize(remainingDebtor)));
            }
            if (remainingCreditor.compareTo(ZERO) > 0) {
                creditors.add(Map.entry(creditor.getKey(), normalize(remainingCreditor)));
            }
        }

        return settlements;
    }

    private void reverseExpenseImpact(String expenseId) {
        List<Balance> expenseBalances = balanceRepository.findByExpenseId(expenseId);

        for (Balance balance : expenseBalances) {
            upsertAggregateBalance(
                    balance.getGroup().getId(),
                    balance.getFromUser().getId(),
                    balance.getToUser().getId(),
                    normalize(balance.getAmount()).negate()
            );
        }

        balanceRepository.deleteAll(expenseBalances);
    }

    public void deleteExpense(String groupId, String expenseId) {
        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);
        ensureCurrentUserInGroup(group, currentUser);

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
        ensureCurrentUserInGroup(group, currentUser);

        Expense existing = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        if (!existing.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Expense does not belong to group");
        }

        reverseExpenseImpact(expenseId);
        expenseRepository.deleteById(expenseId);
        expenseRepository.flush();

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
        ensureCurrentUserInGroup(group, currentUser);

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        List<ExpenseResponse> response = new ArrayList<>();

        for (Expense expense : expenses) {
            List<Balance> balances = balanceRepository.findByExpenseId(expense.getId());

            Set<String> participants = new HashSet<>();
            Map<String, BigDecimal> splitDetails = new HashMap<>();

            for (Balance balance : balances) {
                participants.add(balance.getFromUser().getId());

                if (expense.getSplitType() != SplitType.EQUAL) {
                    splitDetails.merge(
                            balance.getFromUser().getId(),
                            normalize(balance.getAmount()),
                            BigDecimal::add
                    );
                }
            }

            participants.add(expense.getPaidBy().getId());

            response.add(new ExpenseResponse(
                    expense.getId(),
                    expense.getDescription(),
                    normalize(expense.getAmount()),
                    expense.getSplitType(),
                    expense.getPaidBy().getId(),
                    new ArrayList<>(participants),
                    expense.getSplitType() == SplitType.EQUAL ? null : splitDetails,
                    expense.getCreatedAt(),
                    expense.getUpdatedAt()
            ));
        }

        return response;
    }

    public ExpenseResponse getExpenseById(String groupId, String expenseId) {
        User currentUser = userService.getCurrentUser();
        Group group = groupService.getGroup(groupId);
        ensureCurrentUserInGroup(group, currentUser);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        if (!expense.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Expense does not belong to group");
        }

        List<Balance> balances = balanceRepository.findByExpenseId(expense.getId());

        Set<String> participants = new HashSet<>();
        Map<String, BigDecimal> splitDetails = new HashMap<>();

        for (Balance balance : balances) {
            participants.add(balance.getFromUser().getId());

            if (expense.getSplitType() != SplitType.EQUAL) {
                splitDetails.merge(
                        balance.getFromUser().getId(),
                        normalize(balance.getAmount()),
                        BigDecimal::add
                );
            }
        }

        participants.add(expense.getPaidBy().getId());

        return new ExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                normalize(expense.getAmount()),
                expense.getSplitType(),
                expense.getPaidBy().getId(),
                new ArrayList<>(participants),
                expense.getSplitType() == SplitType.EQUAL ? null : splitDetails,
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }

    @Transactional
    public SettlementResponse settleViaBalance(String groupId, SettlementDTO settlementDTO) {
        Group group = groupService.getGroup(groupId);
        User currentUser = userService.getCurrentUser();
        ensureCurrentUserInGroup(group, currentUser);

        if (!Objects.equals(currentUser.getId(), settlementDTO.getFromUserId())) {
            throw new UnauthorizedException("You can only settle balances from your own account");
        }

        if (Objects.equals(settlementDTO.getFromUserId(), settlementDTO.getToUserId())) {
            throw new IllegalArgumentException("fromUserId and toUserId cannot be the same");
        }

        BigDecimal amountToSettle = normalize(settlementDTO.getAmount());
        if (amountToSettle.compareTo(ZERO) <= 0) {
            throw new IllegalArgumentException("Settlement amount must be greater than 0");
        }

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
                .orElseThrow(() -> new IllegalArgumentException("No balance exists between these users"));

        BigDecimal due = normalize(aggBalance.getAmount());
        if (due.compareTo(amountToSettle) < 0) {
            throw new IllegalArgumentException("Settlement amount exceeds due amount");
        }

        BigDecimal remaining = due.subtract(amountToSettle);
        if (remaining.compareTo(ZERO) == 0) {
            groupBalanceAggRepository.delete(aggBalance);
        } else {
            aggBalance.setAmount(normalize(remaining));
            groupBalanceAggRepository.save(aggBalance);
        }

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setToUser(toUser);
        settlement.setFromUser(fromUser);
        settlement.setAmount(amountToSettle);
        settlement.setCreatedAt(Instant.now());

        Settlement settled = settlementRepository.save(settlement);

        return new SettlementResponse(
                settled.getId(),
                group.getId(),
                fromUser.getId(),
                toUser.getId(),
                normalize(settled.getAmount()),
                settled.getCreatedAt()
        );
    }

    @Transactional
    public SettlementResponse settleViaSettle(String groupId, SettlementDTO settlementDTO) {
        Group group = groupService.getGroup(groupId);
        User currentUser = userService.getCurrentUser();
        ensureCurrentUserInGroup(group, currentUser);

        if (!Objects.equals(currentUser.getId(), settlementDTO.getFromUserId())) {
            throw new UnauthorizedException("You can only settle balances from your own account");
        }

        if (Objects.equals(settlementDTO.getFromUserId(), settlementDTO.getToUserId())) {
            throw new IllegalArgumentException("fromUserId and toUserId cannot be the same");
        }

        BigDecimal amountToSettle = normalize(settlementDTO.getAmount());
        if (amountToSettle.compareTo(ZERO) <= 0) {
            throw new IllegalArgumentException("Settlement amount must be greater than 0");
        }

        User fromUser = userService.getUserById(settlementDTO.getFromUserId());
        User toUser = userService.getUserById(settlementDTO.getToUserId());

        if (!group.getMembers().contains(fromUser)) {
            throw new UserNotInGroupException(fromUser.getId());
        }
        if (!group.getMembers().contains(toUser)) {
            throw new UserNotInGroupException(toUser.getId());
        }


        upsertAggregateBalance(group.getId(), toUser.getId(), fromUser.getId(), amountToSettle);

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setToUser(toUser);
        settlement.setFromUser(fromUser);
        settlement.setAmount(amountToSettle);
        settlement.setCreatedAt(Instant.now());

        Settlement settled = settlementRepository.save(settlement);

        return new SettlementResponse(
                settled.getId(),
                group.getId(),
                fromUser.getId(),
                toUser.getId(),
                normalize(settled.getAmount()),
                settled.getCreatedAt()
        );
    }

    private void ensureCurrentUserInGroup(Group group, User user) {
        if (!group.getMembers().contains(user)) {
            throw new UserNotInGroupException(user.getId());
        }
    }

    private BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            throw new InvalidSplitException("Amount cannot be null");
        }
        return value.setScale(MONEY_SCALE, MONEY_ROUNDING);
    }
}
