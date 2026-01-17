import { axiosPrivate } from "../api/axios";

const unwrap = (res) => res.data?.data ?? res.data;

export const balanceService = {
  getBalances: async (groupId) => {
    const res = await axiosPrivate.get(`/api/groups/${groupId}/balances`);
    return unwrap(res);
  },

  // ✅ NEW + correct axios instance
  settleBalance: async (groupId, payload) => {
    const res = await axiosPrivate.post(`/api/groups/${groupId}/balances`, payload);
    return unwrap(res);
  },
};
