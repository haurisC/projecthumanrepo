import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const hasVerified = useRef(false); // Track if we've already attempted verification

  useEffect(() => {
    // Prevent double verification in React Strict Mode
    if (hasVerified.current) return;
    
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    console.log('Starting verification with token:', token);
    hasVerified.current = true; // Mark as attempted
    
    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, 
          { params: { token } }
        );
        
        console.log('Verification successful:', response.data);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        
      } catch (error) {
        console.log('Verification error:', error.response?.data);
        console.log('Status code:', error.response?.status);
        
        // Handle specific error cases
        if (error.response?.status === 400) {
          const errorData = error.response.data;
          const errorMsg = errorData?.error || errorData?.message;
          
          // If token is invalid/expired, but user might already be verified
          if (errorMsg === "Invalid or expired token") {
            setMessage("This verification link has expired or has already been used. If you're seeing this after clicking a fresh link, your email may already be verified.");
            setStatus("warning"); // New status for this case
          } else {
            setMessage(errorMsg || "Verification failed. Please try again.");
            setStatus("error");
          }
        } else {
          setMessage("Network error. Please check your connection and try again.");
          setStatus("error");
        }
      }
    };
    
    verifyEmail();
  }, [location.search]);

  if (status === "loading") {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Verifying your email...</p>
      </div>
    );
  }
  
  if (status === "success") {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'green' }}>
        <h2>✅ Email Verified!</h2>
        <p>{message}</p>
        <p>You can now <a href="/login">login to your account</a>.</p>
      </div>
    );
  }
  
  if (status === "warning") {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'orange' }}>
        <h2>⚠️ Verification Link Used</h2>
        <p>{message}</p>
        <p>Please <a href="/login">try logging in</a> to check if your email is already verified.</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
      <h2>❌ Verification Failed</h2>
      <p>{message}</p>
      <p>You can <a href="/login">try logging in</a> or request a new verification email.</p>
    </div>
  );
}