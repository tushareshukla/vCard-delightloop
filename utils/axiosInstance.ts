import axios from "axios";
import Cookies from "js-cookie";


const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    const orgId = Cookies.get("organization_id");
    const userId = Cookies.get("user_id");
    const userEmail = Cookies.get("user_email");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (orgId) config.headers["x-delightloop-organizationid"] = orgId;
    if (userId) config.headers["x-delightloop-userid"] = userId;
    if (userEmail) config.headers["x-delightloop-useremail"] = userEmail;

    return config;
  },
  (error) => Promise.reject(error)
);
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized — token may be invalid or expired.");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
