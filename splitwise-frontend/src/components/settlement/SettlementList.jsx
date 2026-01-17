import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/formatCurrency";

export default function SettlementList({ items, userMap, members }) {
  const [openUserId, setOpenUserId] = useState(null);

  const getName = (userId) => userMap[userId]?.name || userId;

  const users = useMemo(() => {
    // build all userIds list from members (must show all users)
    const list = (members || []).map((m) => m.id || m.userId);

    // fallback if members missing
    if (list.length === 0) {
      const set = new Set();
      (items || []).forEach((it) => {
        if (it.fromUserId) set.add(it.fromUserId);
        if (it.toUserId) set.add(it.toUserId);
      });
      return Array.from(set);
    }

    return list;
  }, [members, items]);

  const computed = useMemo(() => {
    // for each user:
    // incoming: others pay user
    // outgoing: user pays others
    const incoming = {}; // userId -> [{fromUserId, amount}]
    const outgoing = {}; // userId -> [{toUserId, amount}]
    const totalIn = {}; // userId -> number
    const totalOut = {}; // userId -> number

    users.forEach((u) => {
      incoming[u] = [];
      outgoing[u] = [];
      totalIn[u] = 0;
      totalOut[u] = 0;
    });

    (items || []).forEach((it) => {
      const from = it.fromUserId;
      const to = it.toUserId;
      const amt = Number(it.amount || 0);

      if (!from || !to || amt <= 0) return;

      // from pays -> outgoing
      if (!outgoing[from]) outgoing[from] = [];
      outgoing[from].push({ otherUserId: to, amount: amt });
      totalOut[from] = (totalOut[from] || 0) + amt;

      // to receives -> incoming
      if (!incoming[to]) incoming[to] = [];
      incoming[to].push({ otherUserId: from, amount: amt });
      totalIn[to] = (totalIn[to] || 0) + amt;
    });

    return { incoming, outgoing, totalIn, totalOut };
  }, [items, users]);

  const cards = useMemo(() => {
    const { incoming, outgoing, totalIn, totalOut } = computed;

    return users.map((userId) => {
      const inAmt = Number(totalIn[userId] || 0);
      const outAmt = Number(totalOut[userId] || 0);

      let status = "settled";
      let total = 0;

      if (inAmt > 0) {
        status = "gets";
        total = inAmt;
      } else if (outAmt > 0) {
        status = "owes";
        total = outAmt;
      }

      return {
        userId,
        status,
        total,
        incoming: (incoming[userId] || []).sort((a, b) => b.amount - a.amount),
        outgoing: (outgoing[userId] || []).sort((a, b) => b.amount - a.amount),
      };
    })
    // show biggest unsettled first
    .sort((a, b) => b.total - a.total);
  }, [computed, users]);

  if (!members || members.length === 0) {
    return (
      <div className="rounded-2xl border bg-gray-50 p-5 text-gray-600">
        No members found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((c) => {
        const isOpen = openUserId === c.userId;

        const headerText =
          c.status === "gets"
            ? `${getName(c.userId)} gets`
            : c.status === "owes"
            ? `${getName(c.userId)} owes`
            : `${getName(c.userId)} is settled up`;

        const headerColor =
          c.status === "gets"
            ? "text-green-700"
            : c.status === "owes"
            ? "text-red-700"
            : "text-gray-600";

        const badgeBg =
          c.status === "gets"
            ? "bg-green-50 border-green-200"
            : c.status === "owes"
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-gray-200";

        const breakdown =
          c.status === "gets"
            ? c.incoming
            : c.status === "owes"
            ? c.outgoing
            : [];

        return (
          <div key={c.userId} className="rounded-2xl border bg-white overflow-hidden">
            {/* header */}
            <button
              type="button"
              onClick={() => setOpenUserId(isOpen ? null : c.userId)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="text-left">
                {/* <div className="text-sm text-gray-500">User settlement</div> */}
                <div className={`text-base font-semibold mt-1 ${headerColor}`}>
                  {headerText}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`rounded-xl border px-3 py-2 ${badgeBg}`}>
                  {c.status === "settled" ? (
                    <div className="text-sm font-semibold text-gray-600">Settled</div>
                  ) : (
                    <div className={`text-sm font-bold ${headerColor}`}>
                      {formatCurrency(c.total)}
                    </div>
                  )}
                </div>

                <div className="text-gray-500 text-xl">
                  {isOpen ? "▴" : "▾"}
                </div>
              </div>
            </button>

            {/* breakdown */}
            {isOpen ? (
              <div className="border-t bg-gray-50 p-4 space-y-2">
                {c.status === "settled" ? (
                  <div className="text-sm text-gray-600">
                    🎉 No settlement needed for {getName(c.userId)}.
                  </div>
                ) : breakdown.length === 0 ? (
                  <div className="text-sm text-gray-600">No breakdown available.</div>
                ) : (
                  breakdown.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border bg-white p-3"
                    >
                      <div className="text-sm">
                        {c.status === "gets" ? (
                          <>
                            <span className="font-semibold">{getName(it.otherUserId)}</span>{" "}
                            <span className="text-gray-600">pays</span>{" "}
                            <span className="font-semibold">{getName(c.userId)}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{getName(c.userId)}</span>{" "}
                            <span className="text-gray-600">pays</span>{" "}
                            <span className="font-semibold">{getName(it.otherUserId)}</span>
                          </>
                        )}
                      </div>

                      <div
                        className={`text-sm font-semibold ${
                          c.status === "gets" ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {formatCurrency(it.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
