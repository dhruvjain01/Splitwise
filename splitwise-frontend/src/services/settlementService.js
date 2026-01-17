import { axiosPrivate } from "../api/axios";

const unwrap = (res) => res.data?.data ?? res.data;

export const settlementService = {
  getSettlement: async (groupId) => {
    const res = await axiosPrivate.get(`/api/groups/${groupId}/settle`);
    return unwrap(res);
  },

  // ✅ FIXED: use axiosPrivate not api
  settlePayment: async (groupId, payload) => {
    const res = await axiosPrivate.post(`/api/groups/${groupId}/settle`, payload);
    return unwrap(res);
  },
};
