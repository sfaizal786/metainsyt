// src/lib/api-client.js
import axios from "axios";
import { HOST } from "@/utils/constant.js";

export const apiClient = axios.create({
  baseURL: HOST,
  withCredentials: true, // ✅ Ensures cookies (JWT) are always sent
});
