import api from "./api";

const TOKEN_KEY = "docuthinker_token";
const USER_KEY = "docuthinker_user";

export const storeAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const storeAuthUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getAuthUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  const session = response.data.data;
  storeAuthSession(session);
  return session;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  const session = response.data.data;
  storeAuthSession(session);
  return session;
};

export const fetchCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.data.user;
};
