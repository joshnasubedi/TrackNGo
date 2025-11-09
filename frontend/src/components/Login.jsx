// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';


const Login = () => {
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
    const location = useLocation(); // Add this

      React.useEffect(() => {
    if (location.state?.error) {
      showMessage('error', location.state.error);
      // Clear the state to avoid showing the message again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);


  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Login.jsx - Update the role checking section
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1️⃣ Login
    const response = await fetch('http://localhost:1337/api/auth/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: loginData.identifier,
        password: loginData.password,
      }),
    });

    const data = await response.json();

    if (!data.jwt || !data.user) {
      showMessage('error', data.error?.message || 'Invalid credentials.');
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch full user info with roles - FIXED POPULATE PARAMETER
    const meResponse = await fetch(`http://localhost:1337/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const userData = await meResponse.json();

    // 3️⃣ FIXED: Check the role correctly
    console.log('User data:', userData); // Debug log
    
    const userRole = userData.role?.name || userData.role; // Handle both object and string
    
    if (userRole === 'Driver') {
      showMessage('error', 'Please use the Driver Login page.');
      setLoading(false);
      return;
    }

    // 4️⃣ Only allow Authenticated role users
    if (userRole !== 'Authenticated') {
      showMessage('error', 'Access denied.');
      setLoading(false);
      return;
    }

    // 5️⃣ Store token & user info
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('user', JSON.stringify(userData));

    showMessage('success', 'Login successful!');
    setTimeout(() => navigate('/dashboard'), 1000);

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
    <div className="min-h-screen w-full flex flex-col items-center py-8">
      <header className="navbar flex items-center justify-between w-full shadow-md">
        <a href="/" className="text-2xl font-bold tracking-wide">TrackNGo</a>
      </header>

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

      <div className="w-[360px] h-[500px] mt-6 rounded-[25px] p-5 relative overflow-hidden" style={{ background: "var(--white)" }}>
        <h2 className="text-xl font-semibold text-center mb-6">Parent Login</h2>

        <form onSubmit={handleLogin} className="w-[280px] mt-4 mx-auto">
          <input
            type="text"
            name="identifier"
            value={loginData.identifier}
            onChange={handleLoginChange}
            className="w-full border-b py-3 my-3 outline-none"
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
            style={{ background: "linear-gradient(to right, var(--primary), var(--tertiary))", color: "var(--text)" }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <button
          className="mt-8 py-3 px-6 rounded-[30px] mx-auto block"
          onClick={handleDriverClick}
          disabled={loading}
          style={{ background: "linear-gradient(to right, var(--primary), var(--tertiary))", color: "var(--text)" }}
        >
          Continue as driver
        </button>
      </div>
    </div>
  );
};

export default Login;
