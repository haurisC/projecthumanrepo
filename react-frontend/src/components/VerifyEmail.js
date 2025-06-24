import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/auth/verify-email`, { params: { token } })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [location.search]);

  if (status === "loading") return <p>Verifying your email...</p>;
  if (status === "success") return <p>Email verified successfully! You can now login.</p>;
  return <p>Verification failed. The link may be invalid or expired.</p>;
}