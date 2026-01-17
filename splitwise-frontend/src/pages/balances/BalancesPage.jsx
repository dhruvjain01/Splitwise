// import { useEffect, useMemo, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { balanceService } from "../../services/balanceService";
// import { groupService } from "../../services/groupService";
// import Button from "../../components/common/Button";
// import { formatCurrency } from "../../utils/formatCurrency";

// export default function BalancesPage() {
//   const { groupId } = useParams();
//   const nav = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   const [members, setMembers] = useState([]);
//   const [oweLines, setOweLines] = useState([]); // [{fromUserId,toUserId,amount}]

//   const unwrap = (res) => {
//     if (!res) return res;
//     if (typeof res === "object" && "data" in res) return res.data;
//     return res;
//   };

//   const userMap = useMemo(() => {
//     const map = {};
//     (members || []).forEach((m) => {
//       const id = m.id || m.userId;
//       map[id] = { name: m.name || m.email, email: m.email };
//     });
//     return map;
//   }, [members]);

//   const getName = (userId) => userMap[userId]?.name || userId;

//   /**
//    * ✅ Smart per-user summary based on PAIRWISE NET
//    * pairNet[userId][otherUserId] = signed amount
//    * +ve => user gets from other
//    * -ve => user owes other
//    */
//   const userCards = useMemo(() => {
//     const users = (members || []).map((m) => m.id || m.userId);

//     const pairNet = {};
//     const net = {};

//     users.forEach((u) => {
//       pairNet[u] = {};
//       net[u] = 0;
//     });

//     (oweLines || []).forEach((l) => {
//       const from = l.fromUserId;
//       const to = l.toUserId;
//       const amt = Number(l.amount || 0);
//       if (!from || !to || amt <= 0) return;

//       net[from] = (net[from] || 0) - amt;
//       net[to] = (net[to] || 0) + amt;

//       pairNet[from][to] = (pairNet[from][to] || 0) - amt;
//       pairNet[to][from] = (pairNet[to][from] || 0) + amt;
//     });

//     return users
//       .map((userId) => {
//         const userNet = Number(net[userId] || 0);

//         let status = "settled";
//         let total = 0;

//         if (userNet > 0.01) {
//           status = "gets";
//           total = userNet;
//         } else if (userNet < -0.01) {
//           status = "owes";
//           total = Math.abs(userNet);
//         }

//         // inline breakdown list (no dropdown)
//         const breakdown = Object.entries(pairNet[userId] || {})
//           .map(([otherUserId, signedAmt]) => {
//             const signed = Number(signedAmt || 0);
//             const amount = Math.abs(signed);
//             if (amount <= 0.01) return null;

//             return {
//               otherUserId,
//               amount,
//               type: signed > 0 ? "gets" : "owes",
//             };
//           })
//           .filter(Boolean)
//           .sort((a, b) => b.amount - a.amount);

//         return {
//           userId,
//           name: getName(userId),
//           email: userMap[userId]?.email,
//           status,
//           total,
//           net: userNet,
//           breakdown,
//         };
//       })
//       .sort((a, b) => b.total - a.total);
//   }, [members, oweLines, userMap]);

//   const load = async () => {
//     try {
//       setErr("");
//       setLoading(true);

//       const membersRes = await groupService.getMembers(groupId);
//       setMembers(unwrap(membersRes) || []);

//       const linesRes = await balanceService.getBalances(groupId);
//       setOweLines(unwrap(linesRes) || []);
//     } catch (e) {
//       setErr(e.response?.data?.message || "Failed to load balances");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, [groupId]);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
//             Balances
//           </div>
//           <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
//             Who owes whom
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             Shows current dues based on all expenses.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <Button
//             onClick={() => nav(`/groups/${groupId}/settle`)}
//             className="bg-slate-900 text-white hover:bg-slate-800"
//           >
//             Go to Settle Up →
//           </Button>

//           <Button
//             onClick={load}
//             className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//           >
//             Refresh
//           </Button>
//         </div>
//       </div>

//       {err ? (
//         <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
//           {err}
//         </div>
//       ) : null}

//       {loading ? (
//         <div className="rounded-3xl border border-slate-200 bg-white p-6">
//           <div className="animate-pulse space-y-4">
//             <div className="h-6 w-52 rounded-xl bg-slate-100" />
//             <div className="h-28 w-full rounded-3xl bg-slate-100" />
//             <div className="h-28 w-full rounded-3xl bg-slate-100" />
//           </div>
//         </div>
//       ) : null}

//       {!loading ? (
//         <>
//           {userCards.length === 0 ? (
//             <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
//               No members found.
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {userCards.map((c) => {
//                 const headerText =
//                   c.status === "gets"
//                     ? `${c.name} gets back`
//                     : c.status === "owes"
//                     ? `${c.name} owes`
//                     : `${c.name} is settled up`;

//                 const headerColor =
//                   c.status === "gets"
//                     ? "text-green-700"
//                     : c.status === "owes"
//                     ? "text-red-700"
//                     : "text-slate-700";

//                 const badgeBg =
//                   c.status === "gets"
//                     ? "bg-green-50 border-green-200"
//                     : c.status === "owes"
//                     ? "bg-red-50 border-red-200"
//                     : "bg-slate-50 border-slate-200";

//                 return (
//                   <div key={c.userId} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
//                     {/* Card header */}
//                     <div className="flex items-start justify-between gap-4 px-5 py-4">
//                       <div className="min-w-0">
//                         <div className={`text-base font-extrabold tracking-tight ${headerColor}`}>
//                           {headerText}
//                         </div>
//                         <div className="mt-1 text-sm text-slate-500 truncate">{c.email}</div>
//                       </div>

//                       <div className={`rounded-2xl border px-4 py-2 ${badgeBg}`}>
//                         {c.status === "settled" ? (
//                           <div className="text-sm font-semibold text-slate-600">Settled</div>
//                         ) : (
//                           <div className={`text-sm font-extrabold ${headerColor}`}>
//                             {formatCurrency(c.total)}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Inline list */}
//                     <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
//                       {c.status === "settled" ? (
//                         <div className="text-sm text-slate-600">🎉 No dues.</div>
//                       ) : c.breakdown.length === 0 ? (
//                         <div className="text-sm text-slate-600">No breakdown available.</div>
//                       ) : (
//                         <div className="space-y-2">
//                           {c.breakdown.map((it, idx) => (
//                             <div
//                               key={idx}
//                               className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
//                             >
//                               <div className="text-sm text-slate-700">
//                                 {it.type === "gets" ? (
//                                   <>
//                                     <span className="font-semibold text-slate-900">{c.name}</span>{" "}
//                                     <span className="text-slate-600">gets back from</span>{" "}
//                                     <span className="font-semibold text-slate-900">
//                                       {getName(it.otherUserId)}
//                                     </span>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <span className="font-semibold text-slate-900">{c.name}</span>{" "}
//                                     <span className="text-slate-600">owes</span>{" "}
//                                     <span className="font-semibold text-slate-900">
//                                       {getName(it.otherUserId)}
//                                     </span>
//                                   </>
//                                 )}
//                               </div>

//                               <div
//                                 className={`text-sm font-extrabold ${
//                                   it.type === "gets" ? "text-green-700" : "text-red-700"
//                                 }`}
//                               >
//                                 {formatCurrency(it.amount)}
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </>
//       ) : null}
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { balanceService } from "../../services/balanceService";
import { groupService } from "../../services/groupService";
import Button from "../../components/common/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import SettleBalanceModal from "../../components/balances/SettleBalanceModal";

export default function BalancesPage() {
  const { groupId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [members, setMembers] = useState([]);
  const [oweLines, setOweLines] = useState([]); // [{fromUserId,toUserId,amount}]
  const [settlingKey, setSettlingKey] = useState(null);

  // ✅ modal state (new)
  const [openSettle, setOpenSettle] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null); // {fromUserId,toUserId,amount}
  const [settling, setSettling] = useState(false);
  const [settleErr, setSettleErr] = useState("");

  const unwrap = (res) => {
    if (!res) return res;
    if (typeof res === "object" && "data" in res) return res.data;
    return res;
  };

  const userMap = useMemo(() => {
    const map = {};
    (members || []).forEach((m) => {
      const id = m.id || m.userId;
      map[id] = { name: m.name || m.email, email: m.email };
    });
    return map;
  }, [members]);

  const getName = (userId) => userMap[userId]?.name || userId;

  /**
   * ✅ pairNet logic (correct + no "owed by" bug)
   */
  const userCards = useMemo(() => {
    const users = (members || []).map((m) => m.id || m.userId);

    const pairNet = {};
    const net = {};

    users.forEach((u) => {
      pairNet[u] = {};
      net[u] = 0;
    });

    (oweLines || []).forEach((l) => {
      const from = l.fromUserId;
      const to = l.toUserId;
      const amt = Number(l.amount || 0);
      if (!from || !to || amt <= 0) return;

      net[from] = (net[from] || 0) - amt;
      net[to] = (net[to] || 0) + amt;

      pairNet[from][to] = (pairNet[from][to] || 0) - amt;
      pairNet[to][from] = (pairNet[to][from] || 0) + amt;
    });

    return users
      .map((userId) => {
        const userNet = Number(net[userId] || 0);

        let status = "settled";
        let total = 0;

        if (userNet > 0.01) {
          status = "gets";
          total = userNet;
        } else if (userNet < -0.01) {
          status = "owes";
          total = Math.abs(userNet);
        }

        const breakdown = Object.entries(pairNet[userId] || {})
          .map(([otherUserId, signedAmt]) => {
            const signed = Number(signedAmt || 0);
            const amount = Math.abs(signed);
            if (amount <= 0.01) return null;

            return {
              otherUserId,
              amount,
              type: signed > 0 ? "gets" : "owes",
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.amount - a.amount);

        return {
          userId,
          name: getName(userId),
          email: userMap[userId]?.email,
          status,
          total,
          breakdown,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [members, oweLines, userMap]);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const membersRes = await groupService.getMembers(groupId);
      setMembers(unwrap(membersRes) || []);

      const linesRes = await balanceService.getBalances(groupId);
      setOweLines(unwrap(linesRes) || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  // ✅ Instead of settling directly -> open modal
  const openSettleModal = ({ fromUserId, toUserId, amount }) => {
    const amt = Number(amount || 0);
    if (!fromUserId || !toUserId || amt <= 0) return;

    setSelectedTx({ fromUserId, toUserId, amount: amt });
    setSettleErr("");
    setOpenSettle(true);
  };

  // ✅ Confirm settle from modal
  const confirmSettle = async () => {
    if (!selectedTx) return;

    const { fromUserId, toUserId, amount } = selectedTx;
    const key = `${fromUserId}_${toUserId}_${Number(amount || 0)}`;

    setSettling(true);
    setSettlingKey(key);
    setSettleErr("");
    setErr("");

    try {
      await balanceService.settleBalance(groupId, {
        fromUserId,
        toUserId,
        amount: Number(amount || 0),
      });

      setOpenSettle(false);
      setSelectedTx(null);

      await load();
    } catch (e) {
      setSettleErr(e.response?.data?.message || "Failed to settle amount");
    } finally {
      setSettling(false);
      setSettlingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Balances
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Who owes whom
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Shows current dues based on all expenses.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => nav(`/groups/${groupId}/settle`)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Go to Settle Up →
          </Button>

          <Button
            onClick={load}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {err ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? <p className="text-slate-600">Loading balances...</p> : null}

      {!loading ? (
        <>
          {userCards.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
              No members found.
            </div>
          ) : (
            <div className="space-y-3">
              {userCards.map((c) => {
                const headerText =
                  c.status === "gets"
                    ? `${c.name} gets back`
                    : c.status === "owes"
                    ? `${c.name} owes`
                    : `${c.name} is settled up`;

                const headerColor =
                  c.status === "gets"
                    ? "text-green-700"
                    : c.status === "owes"
                    ? "text-red-700"
                    : "text-slate-700";

                const badgeBg =
                  c.status === "gets"
                    ? "bg-green-50 border-green-200"
                    : c.status === "owes"
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-50 border-slate-200";

                return (
                  <div
                    key={c.userId}
                    className="rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div
                          className={`text-base font-extrabold tracking-tight ${headerColor}`}
                        >
                          {headerText}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 truncate">
                          {c.email}
                        </div>
                      </div>

                      <div className={`rounded-2xl border px-4 py-2 ${badgeBg}`}>
                        {c.status === "settled" ? (
                          <div className="text-sm font-semibold text-slate-600">
                            Settled
                          </div>
                        ) : (
                          <div className={`text-sm font-extrabold ${headerColor}`}>
                            {formatCurrency(c.total)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline list */}
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                      {c.status === "settled" ? (
                        <div className="text-sm text-slate-600">🎉 No dues.</div>
                      ) : c.breakdown.length === 0 ? (
                        <div className="text-sm text-slate-600">
                          No breakdown available.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {c.breakdown.map((it, idx) => {
                            // If user "owes": from = user, to = other
                            // If user "gets": from = other, to = user
                            const fromUserId =
                              it.type === "owes" ? c.userId : it.otherUserId;
                            const toUserId =
                              it.type === "owes" ? it.otherUserId : c.userId;
                            const amt = Number(it.amount || 0);

                            const key = `${fromUserId}_${toUserId}_${amt}`;
                            const busy = settlingKey === key;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                              >
                                <div className="text-sm text-slate-700">
                                  {it.type === "gets" ? (
                                    <>
                                      <span className="font-semibold text-slate-900">
                                        {c.name}
                                      </span>{" "}
                                      <span className="text-slate-600">
                                        gets back from
                                      </span>{" "}
                                      <span className="font-semibold text-slate-900">
                                        {getName(it.otherUserId)}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-slate-900">
                                        {c.name}
                                      </span>{" "}
                                      <span className="text-slate-600">owes</span>{" "}
                                      <span className="font-semibold text-slate-900">
                                        {getName(it.otherUserId)}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <div
                                    className={`text-sm font-extrabold ${
                                      it.type === "gets"
                                        ? "text-green-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {formatCurrency(it.amount)}
                                  </div>

                                  {/* ✅ NOW opens modal instead of direct settle */}
                                  <Button
                                    disabled={busy}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openSettleModal({
                                        fromUserId,
                                        toUserId,
                                        amount: amt,
                                      });
                                    }}
                                    className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  >
                                    {busy ? "Settling..." : "Settle"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* ✅ Modal */}
      <SettleBalanceModal
        open={openSettle}
        onClose={() => {
          if (settling) return;
          setOpenSettle(false);
          setSelectedTx(null);
        }}
        onConfirm={confirmSettle}
        loading={settling}
        err={settleErr}
        fromName={selectedTx ? getName(selectedTx.fromUserId) : ""}
        toName={selectedTx ? getName(selectedTx.toUserId) : ""}
        amount={selectedTx ? selectedTx.amount : 0}
      />
    </div>
  );
}
