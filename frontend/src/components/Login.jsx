// Login.jsx - Simplified without registration
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [loginData, setLoginData] = useState({ 
    identifier: "", 
    password: "" 
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Handle input changes
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Login Handler - SIMPLIFIED
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Strapi's built-in authentication endpoint
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: loginData.identifier,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (data.jwt && data.user) {
        // Login successful - store token and user data
        localStorage.setItem('token', data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('🔑 Token saved:', data.jwt);
        console.log('👤 User saved:', data.user);
        
        showMessage('success', 'Login successful!');
        
        // Check role safely
        const userRole = data.user.role?.name || data.user.role?.type || 'authenticated';
        console.log('User role:', userRole);
        
        // Redirect based on role
        setTimeout(() => {
          if (userRole === 'Driver') {
            navigate('/driver-homepage');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
        
      } else {
        // Login failed
        console.error('Login failed:', data.error);
        showMessage('error', data.error?.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverClick = () => {
    navigate("/driver-login");
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

      {/* Message Display */}
      {message.text && (
        <div
          className={`w-96 mt-4 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-100 border border-green-400 text-green-700" 
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div
        className="w-[360px] h-[500px] mt-6 rounded-[25px] p-5 relative overflow-hidden"
        style={{ background: "var(--white)" }}
      >
        <h2 className="text-xl font-semibold text-center mb-6">Parent Login</h2>

        <form
          onSubmit={handleLogin}
          className={`w-[280px] mt-4 mx-auto`}
        >
          <input
            type="text"
            name="identifier"
            value={loginData.identifier}
            onChange={handleLoginChange}
            className="w-full border-b py-3 my-3 outline-none"
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
            className="w-full border-b py-3 my-3 outline-none"
            style={{ background: "transparent", borderColor: "#ccc" }}
            placeholder="Password"
            required
            disabled={loading}
          />
          <div className="my-4">
            <input type="checkbox" className="mr-2" required disabled={loading} />
            <span className="text-sm">I agree to the terms and conditions.</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-[85%] py-3 px-4 rounded-[30px] mx-auto block disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, var(--primary), var(--tertiary))",
              color: "var(--text)",
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Driver Login Button */}
        <button
          className="mt-8 py-3 px-6 rounded-[30px] mx-auto block"
          onClick={handleDriverClick}
          disabled={loading}
          style={{
            background: "linear-gradient(to right, var(--primary), var(--tertiary))",
            color: "var(--text)",
          }}
        >
          Continue as driver
        </button>
      </div>
    </div>
  );
};

export default Login;