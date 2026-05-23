import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,

  register: async (fullName, studentId, email, department, password, role = "student") => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/register", {
        fullName, studentId, email, department, password, role,
      });
      await AsyncStorage.multiSet([
        ["user", JSON.stringify(data.user)],
        ["token", data.token],
      ]);
      // Update default header for subsequent calls
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  login: async (email, password, role = "student") => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password, role });
      await AsyncStorage.multiSet([
        ["user", JSON.stringify(data.user)],
        ["token", data.token],
      ]);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    try {
      const [[, token], [, userJson]] = await AsyncStorage.multiGet(["token", "user"]);
      const user = userJson ? JSON.parse(userJson) : null;
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      set({ token, user });
    } catch (error) {
      console.log("Auth check failed", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  updateUser: async (updatedUser) => {
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    delete api.defaults.headers.common["Authorization"];
    set({ token: null, user: null });
  },
}));
