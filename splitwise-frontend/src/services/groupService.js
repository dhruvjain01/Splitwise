import { axiosPrivate } from "../api/axios";

const unwrap = (res) => res.data?.data ?? res.data;

export const groupService = {
  getGroups: async () => {
    const res = await axiosPrivate.get("/api/groups");
    return unwrap(res);
  },

  createGroup: async (payload) => {
    const res = await axiosPrivate.post("/api/groups", payload);
    return unwrap(res);
  },

  getMembers: async (groupId) => {
    const res = await axiosPrivate.get(`/api/groups/${groupId}/members`);
    return unwrap(res);
  },

  addMember: async (groupId, payload) => {
    const res = await axiosPrivate.post(`/api/groups/${groupId}/members`, payload);
    return unwrap(res);
  },
};
