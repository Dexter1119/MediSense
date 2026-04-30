////////////////////////////////////////////////////////////////////
//
// File Name : axiosInstance.js
// Description : Axios instance for Flask backend communication
// Author : Pradhumnya Changdev Kalsait
// Date : 17/01/26
//
////////////////////////////////////////////////////////////////////

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  withCredentials: true, // ✅ Required for CORS + JWT
});

/**
 * ////////////////////////////////////////////////////////////////
 *
 * Interceptor : Request
 * Description : Automatically attaches JWT token to all API requests
 *
 * ////////////////////////////////////////////////////////////////
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
