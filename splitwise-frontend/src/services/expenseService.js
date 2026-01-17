import { axiosPrivate } from "../api/axios";

const unwrap = (res) => res.data?.data ?? res.data;

export const expenseService = {
  getExpenses: async (groupId) => {
    const res = await axiosPrivate.get(`/api/groups/${groupId}/expenses`);
    return unwrap(res);
  },

  addExpense: async (groupId, payload) => {
    const res = await axiosPrivate.post(`/api/groups/${groupId}/expenses`, payload);
    return unwrap(res);
  },

  updateExpense: async (groupId, expenseId, payload) => {
    const res = await axiosPrivate.put(`/api/groups/${groupId}/expenses/${expenseId}`, payload);
    return unwrap(res);
  },

  deleteExpense: async (groupId, expenseId) => {
    const res = await axiosPrivate.delete(`/api/groups/${groupId}/expenses/${expenseId}`);
    return unwrap(res);
  },
};
