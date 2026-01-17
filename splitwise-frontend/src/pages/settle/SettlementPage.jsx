// import { useEffect, useMemo, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Button from "../../components/common/Button";
// import { settlementService } from "../../services/settlementService";
// import { balanceService } from "../../services/balanceService";
// import { groupService } from "../../services/groupService";
// import { formatCurrency } from "../../utils/formatCurrency";

// export default function SettlementPage() {
//   const { groupId } = useParams();
//   const nav = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   const [members, setMembers] = useState([]);
//   const [settlements, setSettlements] = useState([]); // optimized transactions
//   const [oweLines, setOweLines] = useState([]); // naive transactions (balances api)

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
//    * Build per-user summary:
//    * - total gets
//    * - total owes
//    * - inline breakdown list
//    */
//   const userCards = useMemo(() => {
//     const users = (members || []).map((m) => m.id || m.userId);

//     const totalGets = {};
//     const totalOwes = {};
//     const breakdown = {};

//     users.forEach((u) => {
//       totalGets[u] = 0;
//       totalOwes[u] = 0;
//       breakdown[u] = [];
//     });

//     (settlements || []).forEach((t) => {
//       const from = t.fromUserId;
//       const to = t.toUserId;
//       const amt = Number(t.amount || 0);

//       if (!from || !to || amt <= 0) return;

//       // from pays -> owes
//       totalOwes[from] = (totalOwes[from] || 0) + amt;
//       breakdown[from].push({ type: "pays", otherUserId: to, amount: amt });

//       // to receives -> gets
//       totalGets[to] = (totalGets[to] || 0) + amt;
//       breakdown[to].push({ type: "receives", otherUserId: from, amount: amt });
//     });

//     return users
//       .map((userId) => {
//         const gets = Number(totalGets[userId] || 0);
//         const owes = Number(totalOwes[userId] || 0);

//         let status = "settled";
//         let total = 0;

//         if (gets > owes + 0.01) {
//           status = "gets";
//           total = gets - owes;
//         } else if (owes > gets + 0.01) {
//           status = "owes";
//           total = owes - gets;
//         }

//         // merge duplicate otherUserId for cleanliness
//         const mergedMap = {};
//         (breakdown[userId] || []).forEach((x) => {
//           const key = `${x.type}_${x.otherUserId}`;
//           mergedMap[key] = (mergedMap[key] || 0) + Number(x.amount || 0);
//         });

//         const list = Object.entries(mergedMap)
//           .map(([key, amount]) => {
//             const [type, otherUserId] = key.split("_");
//             return { type, otherUserId, amount };
//           })
//           .sort((a, b) => b.amount - a.amount);

//         return {
//           userId,
//           name: getName(userId),
//           email: userMap[userId]?.email,
//           status,
//           total,
//           list,
//         };
//       })
//       .sort((a, b) => b.total - a.total);
//   }, [members, settlements, userMap]);

//   const load = async () => {
//     try {
//       setErr("");
//       setLoading(true);

//       const mRes = await groupService.getMembers(groupId);
//       setMembers(unwrap(mRes) || []);

//       const sRes = await settlementService.getSettlement(groupId);
//       setSettlements(unwrap(sRes) || []);

//       // naive transactions = balances edges count
//       const bRes = await balanceService.getBalances(groupId);
//       setOweLines(unwrap(bRes) || []);
//     } catch (e) {
//       setErr(e.response?.data?.message || "Failed to load settlement");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, [groupId]);

//   const naiveCount = (oweLines || []).filter((x) => Number(x.amount || 0) > 0).length;
//   const optCount = (settlements || []).filter((x) => Number(x.amount || 0) > 0).length;
//   const reducedBy = Math.max(0, naiveCount - optCount);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
//             Settle Up
//           </div>
//           <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
//             Settlement plan
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             Recommended payments to settle the group with fewer transactions.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <Button
//             onClick={() => nav(`/groups/${groupId}/balances`)}
//             className="bg-slate-900 text-white hover:bg-slate-800"
//           >
//             Go to Balances →
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
//           {/* Analytics card */}
//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="text-sm font-extrabold tracking-tight text-slate-900">
//               Transaction Optimization
//             </div>

//             <div className="mt-2 grid gap-3 sm:grid-cols-3">
//               <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
//                 <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
//                   Naive splits
//                 </div>
//                 <div className="mt-1 text-xl font-extrabold text-slate-900">
//                   {naiveCount}
//                 </div>
//                 <div className="text-sm text-slate-500">Possible dues</div>
//               </div>

//               <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
//                 <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
//                   Optimized
//                 </div>
//                 <div className="mt-1 text-xl font-extrabold text-slate-900">
//                   {optCount}
//                 </div>
//                 <div className="text-sm text-slate-500">Settlement payments</div>
//               </div>

//               <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
//                 <div className="text-xs font-bold uppercase tracking-widest text-green-700">
//                   Reduced
//                 </div>
//                 <div className="mt-1 text-xl font-extrabold text-green-800">
//                   {reducedBy}
//                 </div>
//                 <div className="text-sm text-green-700">fewer transactions</div>
//               </div>
//             </div>
//           </div>

//           {/* Users */}
//           {userCards.length === 0 ? (
//             <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
//               No members found.
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {userCards.map((u) => {
//                 const headerText =
//                   u.status === "gets"
//                     ? `${u.name} receives`
//                     : u.status === "owes"
//                     ? `${u.name} pays`
//                     : `${u.name} is settled up`;

//                 const headerColor =
//                   u.status === "gets"
//                     ? "text-green-700"
//                     : u.status === "owes"
//                     ? "text-red-700"
//                     : "text-slate-700";

//                 const badgeBg =
//                   u.status === "gets"
//                     ? "bg-green-50 border-green-200"
//                     : u.status === "owes"
//                     ? "bg-red-50 border-red-200"
//                     : "bg-slate-50 border-slate-200";

//                 return (
//                   <div
//                     key={u.userId}
//                     className="rounded-3xl border border-slate-200 bg-white shadow-sm"
//                   >
//                     <div className="flex items-start justify-between gap-4 px-5 py-4">
//                       <div className="min-w-0">
//                         <div className={`text-base font-extrabold tracking-tight ${headerColor}`}>
//                           {headerText}
//                         </div>
//                         <div className="mt-1 text-sm text-slate-500 truncate">{u.email}</div>
//                       </div>

//                       <div className={`rounded-2xl border px-4 py-2 ${badgeBg}`}>
//                         {u.status === "settled" ? (
//                           <div className="text-sm font-semibold text-slate-600">Settled</div>
//                         ) : (
//                           <div className={`text-sm font-extrabold ${headerColor}`}>
//                             {formatCurrency(u.total)}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
//                       {u.status === "settled" ? (
//                         <div className="text-sm text-slate-600">🎉 No settlement needed.</div>
//                       ) : u.list.length === 0 ? (
//                         <div className="text-sm text-slate-600">No details available.</div>
//                       ) : (
//                         <div className="space-y-2">
//                           {u.list.map((x, idx) => (
//                             <div
//                               key={idx}
//                               className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
//                             >
//                               <div className="text-sm text-slate-700">
//                                 {x.type === "receives" ? (
//                                   <>
//                                     <span className="font-semibold text-slate-900">{u.name}</span>{" "}
//                                     <span className="text-slate-600">receives from</span>{" "}
//                                     <span className="font-semibold text-slate-900">
//                                       {getName(x.otherUserId)}
//                                     </span>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <span className="font-semibold text-slate-900">{u.name}</span>{" "}
//                                     <span className="text-slate-600">pays</span>{" "}
//                                     <span className="font-semibold text-slate-900">
//                                       {getName(x.otherUserId)}
//                                     </span>
//                                   </>
//                                 )}
//                               </div>

//                               <div
//                                 className={`text-sm font-extrabold ${
//                                   x.type === "receives" ? "text-green-700" : "text-red-700"
//                                 }`}
//                               >
//                                 {formatCurrency(x.amount)}
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
import Button from "../../components/common/Button";
import { settlementService } from "../../services/settlementService";
import { groupService } from "../../services/groupService";
import { formatCurrency } from "../../utils/formatCurrency";
import SettlePaymentModal from "../../components/settlement/SettlePaymentModal";

export default function SettlementPage() {
  const { groupId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [members, setMembers] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // ✅ modal state
  const [openSettle, setOpenSettle] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [settling, setSettling] = useState(false);
  const [settleErr, setSettleErr] = useState("");

  // ✅ robust unwrap
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

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const membersRes = await groupService.getMembers(groupId);
      const mList = unwrap(membersRes);
      setMembers(Array.isArray(mList) ? mList : []);

      const settleRes = await settlementService.getSettlement(groupId);
      const raw = unwrap(settleRes);

      // ✅ force to array
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      // ✅ sanitize entries
      const cleaned = list
        .map((x) => ({
          fromUserId: x.fromUserId,
          toUserId: x.toUserId,
          amount: Number(x.amount || 0),
        }))
        .filter((x) => x.fromUserId && x.toUserId && x.amount > 0);

      setSettlements(cleaned);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load settlement");
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  // ✅ counts
  const naiveCount = useMemo(() => {
    // naive = each participant split => n*(n-1) worst case
    const n = (members || []).length;
    if (n <= 1) return 0;
    return n * (n - 1);
  }, [members]);

  const optCount = useMemo(() => (settlements || []).length, [settlements]);

  const reducedBy = useMemo(() => {
    const r = naiveCount - optCount;
    return r > 0 ? r : 0;
  }, [naiveCount, optCount]);

  /**
   * ✅ Build old-style user cards from settlements list
   */
  const userCards = useMemo(() => {
    const users = (members || []).map((m) => m.id || m.userId);

    const incoming = {};
    const outgoing = {};
    const listMap = {};

    users.forEach((u) => {
      incoming[u] = 0;
      outgoing[u] = 0;
      listMap[u] = [];
    });

    (settlements || []).forEach((s) => {
      const from = s.fromUserId;
      const to = s.toUserId;
      const amt = Number(s.amount || 0);
      if (!from || !to || amt <= 0) return;

      // from pays -> outgoing
      outgoing[from] = (outgoing[from] || 0) + amt;

      // to receives -> incoming
      incoming[to] = (incoming[to] || 0) + amt;

      // list items
      listMap[from] = listMap[from] || [];
      listMap[from].push({
        type: "pays",
        otherUserId: to,
        amount: amt,
        fromUserId: from,
        toUserId: to,
      });

      listMap[to] = listMap[to] || [];
      listMap[to].push({
        type: "receives",
        otherUserId: from,
        amount: amt,
        fromUserId: from,
        toUserId: to,
      });
    });

    return users
      .map((u) => {
        const inAmt = Number(incoming[u] || 0);
        const outAmt = Number(outgoing[u] || 0);

        let status = "settled";
        let total = 0;

        if (inAmt > outAmt + 0.01) {
          status = "gets";
          total = inAmt - outAmt;
        } else if (outAmt > inAmt + 0.01) {
          status = "owes";
          total = outAmt - inAmt;
        }

        const list = (listMap[u] || []).sort((a, b) => b.amount - a.amount);

        return {
          userId: u,
          name: getName(u),
          email: userMap[u]?.email,
          status,
          total,
          list,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [members, settlements, userMap]);

  const openSettleModal = (tx) => {
    setSelectedTx(tx);
    setSettleErr("");
    setOpenSettle(true);
  };

  const confirmSettle = async () => {
    if (!selectedTx) return;

    try {
      setSettling(true);
      setSettleErr("");

      await settlementService.settlePayment(groupId, {
        fromUserId: selectedTx.fromUserId,
        toUserId: selectedTx.toUserId,
        amount: Number(selectedTx.amount || 0),
      });

      setOpenSettle(false);
      setSelectedTx(null);

      await load();
    } catch (e) {
      setSettleErr(e.response?.data?.message || "Failed to settle payment");
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Settle Up
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Settlement plan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Recommended payments to settle the group with fewer transactions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* <Button
            onClick={() => nav(`/groups/${groupId}/balances`)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Go to Balances →
          </Button> */}

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

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-52 rounded-xl bg-slate-100" />
            <div className="h-28 w-full rounded-3xl bg-slate-100" />
            <div className="h-28 w-full rounded-3xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {!loading ? (
        <>
          {/* Analytics card */}
          {/* <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">
              Transaction Optimization
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Naive splits
                </div>
                <div className="mt-1 text-xl font-extrabold text-slate-900">
                  {naiveCount}
                </div>
                <div className="text-sm text-slate-500">Possible dues</div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Optimized
                </div>
                <div className="mt-1 text-xl font-extrabold text-slate-900">
                  {optCount}
                </div>
                <div className="text-sm text-slate-500">Settlement payments</div>
              </div>

              <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Reduced
                </div>
                <div className="mt-1 text-xl font-extrabold text-green-800">
                  {reducedBy}
                </div>
                <div className="text-sm text-green-700">fewer transactions</div>
              </div>
            </div>
          </div> */}

          {/* Users */}
          {userCards.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
              🎉 No settlement needed.
            </div>
          ) : (
            <div className="space-y-3">
              {userCards.map((u) => {
                const headerText =
                  u.status === "gets"
                    ? `${u.name} receives`
                    : u.status === "owes"
                    ? `${u.name} pays`
                    : `${u.name} is settled up`;

                const headerColor =
                  u.status === "gets"
                    ? "text-green-700"
                    : u.status === "owes"
                    ? "text-red-700"
                    : "text-slate-700";

                const badgeBg =
                  u.status === "gets"
                    ? "bg-green-50 border-green-200"
                    : u.status === "owes"
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-50 border-slate-200";

                return (
                  <div
                    key={u.userId}
                    className="rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div className={`text-base font-extrabold tracking-tight ${headerColor}`}>
                          {headerText}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 truncate">{u.email}</div>
                      </div>

                      <div className={`rounded-2xl border px-4 py-2 ${badgeBg}`}>
                        {u.status === "settled" ? (
                          <div className="text-sm font-semibold text-slate-600">Settled</div>
                        ) : (
                          <div className={`text-sm font-extrabold ${headerColor}`}>
                            {formatCurrency(u.total)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                      {u.status === "settled" ? (
                        <div className="text-sm text-slate-600">🎉 No settlement needed.</div>
                      ) : u.list.length === 0 ? (
                        <div className="text-sm text-slate-600">No details available.</div>
                      ) : (
                        <div className="space-y-2">
                          {u.list.map((x, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="text-sm text-slate-700">
                                {x.type === "receives" ? (
                                  <>
                                    <span className="font-semibold text-slate-900">{u.name}</span>{" "}
                                    <span className="text-slate-600">receives from</span>{" "}
                                    <span className="font-semibold text-slate-900">
                                      {getName(x.otherUserId)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold text-slate-900">{u.name}</span>{" "}
                                    <span className="text-slate-600">pays</span>{" "}
                                    <span className="font-semibold text-slate-900">
                                      {getName(x.otherUserId)}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div
                                  className={`text-sm font-extrabold ${
                                    x.type === "receives" ? "text-green-700" : "text-red-700"
                                  }`}
                                >
                                  {formatCurrency(x.amount)}
                                </div>

                                {/* ✅ settle button only for pays */}
                                {x.type === "pays" ? (
                                  <Button
                                    onClick={() =>
                                      openSettleModal({
                                        fromUserId: x.fromUserId,
                                        toUserId: x.toUserId,
                                        amount: x.amount,
                                      })
                                    }
                                    className="bg-slate-900 text-white hover:bg-slate-800"
                                  >
                                    Settle
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
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
      <SettlePaymentModal
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
