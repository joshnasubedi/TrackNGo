import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DriverLogin = () => {
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🚗 Attempting driver login with:', loginData);
      
      const response = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginData.identifier,
          password: loginData.password,
        }),
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Full response data:', data);

      if (data.jwt && data.user) {
        console.log('✅ Driver login successful!');
        
        // Save with DRIVER-specific keys
        localStorage.setItem("driver_token", data.jwt);
        localStorage.setItem("driver_user", JSON.stringify(data.user));
        
        console.log('🔄 Navigating to /driver-homepage...');
        navigate("/driver-homepage");
        
      } else {
        console.log('❌ Login failed:', data.error);
        alert(data.error?.message || "Invalid login");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-8"
      style={{ background: "var(--background)", color: "var(--text)" }}
    >
      <header className="navbar flex items-center justify-between w-full shadow-md">
        <a href="/" className="text-2xl font-bold tracking-wide">
          TrackNGo
        </a>
      </header>

      <div
        className="w-[360px] h-[500px] mt-6 rounded-[25px] p-5 relative overflow-hidden"
        style={{ background: "var(--white)" }}
      >
        <h2 className="text-xl font-semibold text-center mb-4">Driver Login</h2>

        <form
          onSubmit={handleLogin}
          className="w-[280px] mx-auto mt-8"
        >
          <input
            type="text"
            name="identifier"
            value={loginData.identifier}
            onChange={handleLoginChange}
            className="w-full border-b py-2 my-2 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Email or Username"
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-full border-b py-2 my-2 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Password"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-[85%] py-2 px-4 rounded-[30px] mx-auto block mt-6 disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, var(--primary), var(--tertiary))",
              color: "var(--text)",
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverLogin;