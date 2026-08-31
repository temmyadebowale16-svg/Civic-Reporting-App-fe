import { useState } from "react";
import PropTypes from "prop-types";
import { adminLogin } from "../api/client";

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Validate input
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting login with username:", username);
      const data = await adminLogin(username, password);
      console.log("Login successful:", { token: data.token?.substring(0, 20) + "..." });
      onLoginSuccess(data.token, data.username);
    } catch (err) {
      console.error("Login error:", err.response?.status, err.response?.data);
      
      // Provide specific error messages based on response status
      let errorMsg = "Login failed. Please try again.";
      
      if (err.response?.status === 400) {
        errorMsg = err.response?.data?.detail || "Invalid input. Please check your credentials.";
      } else if (err.response?.status === 401) {
        errorMsg = err.response?.data?.detail || "Invalid username or password.";
      } else if (err.response?.status === 403) {
        errorMsg = err.response?.data?.detail || "Your account doesn't have admin access.";
      } else if (err.response?.status === 429) {
        errorMsg = err.response?.data?.detail || "Too many login attempts. Please wait 5 minutes.";
      } else if (err.code === "ECONNABORTED") {
        errorMsg = "Connection timeout. Is the server running?";
      } else if (err.message?.includes("ERR_INTERNET_DISCONNECTED")) {
        errorMsg = "Network error. Check your internet connection.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-xs flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-display text-xl font-bold text-civic-green">Admin Login</h2>
      
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
        Username
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter admin username"
          disabled={loading}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-base font-normal focus:border-civic-green focus:outline-none focus:ring-1 focus:ring-civic-green disabled:bg-gray-100"
        />
      </label>
      
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          disabled={loading}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-base font-normal focus:border-civic-green focus:outline-none focus:ring-1 focus:ring-civic-green disabled:bg-gray-100"
        />
      </label>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-civic-green px-4 py-2 text-sm font-semibold text-white hover:bg-civic-green-dark disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
      
      <p className="text-xs text-gray-500">
        💡 Tip: Make sure your superuser account exists and is marked as staff. 
        {" "}<br />
        Run <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">python manage.py createsuperuser</code> if needed.
      </p>
    </form>
  );
}

AdminLogin.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
