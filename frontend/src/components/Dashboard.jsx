// components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import './Dashboard.css';
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../api/api";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../context/NotificationContext";

const Dashboard = () => {
  const [greeting, setGreeting] = useState("Hello!");
  const [buses, setBuses] = useState(0);
  const [drivers, setDrivers] = useState(0);
  const [parents, setParents] = useState(0);
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { notifications, unreadCount, addNotification, refreshNotifications } = useNotifications();

  // HARDCODED PARENT-CHILD MAPPING
  const parentChildMapping = {
    'kriti_thapa': ['Ram'],
    'joshna_subedi': ['Sita'],
    'pratistha_koirala': ['Gita']
  };

  // HARDCODED PICKUP POINT MAPPING
  const pickupPointMapping = {
    'Ram': 'School Main Gate',
    'Sita': 'Park Area',
    'Gita': 'Main Road Entrance'
  };

  // Test Notification Button Component
  const TestNotificationButton = () => {
    const testNotification = () => {
      const testNotif = {
        id: Date.now(), // temporary ID
        message: "🧪 TEST: Your child has been picked up from school",
        type: "pickup",
        timestamp: new Date().toISOString(),
        notification_status: "sent",
        child: { name: "Test Child" }
      };
      
      console.log('🧪 Sending test notification:', testNotif);
      addNotification(testNotif);
      alert('Test notification sent! Check if it appears in notifications.');
    };

    return (
      <button 
        onClick={testNotification}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        🧪 Test Notification
      </button>
    );
  };

  // Check Strapi Notifications Function
  const checkStrapiNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('🔍 Checking Strapi notifications for user:', user?.id);
      
      const response = await fetchDataFromApi('/notifications?populate=*&sort=id:desc&pagination[limit]=10');
      const allNotifications = response.data || [];
      
      console.log('📋 All notifications in Strapi:', allNotifications);
      
      // Filter notifications for current user
      const myNotifications = allNotifications.filter(notif => 
        notif.parent?.id === user?.id
      );
      
      console.log('✅ My notifications:', myNotifications);
      alert(`Found ${myNotifications.length} notifications in Strapi for your account`);
      
    } catch (error) {
      console.error('❌ Error checking Strapi notifications:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('👤 Current user:', user?.username);
      
      const response = await fetchDataFromApi('/children?populate=*');
      let childrenData = response.data || response || [];
      
      console.log('📦 All children from API:', childrenData);
      
      // Filter children based on hardcoded mapping
      const myChildren = childrenData.filter(child => {
        const childName = child.name || child.attributes?.name;
        const userChildren = parentChildMapping[user?.username] || [];
        const isMyChild = userChildren.includes(childName);
        
        console.log(`🔍 Checking child ${childName}:`, {
          belongsToUser: isMyChild,
          userChildren: userChildren
        });
        
        return isMyChild;
      }).map(child => {
        const childName = child.name || child.attributes?.name;
        return {
          id: child.id,
          name: childName,
          grade: child.grade || child.attributes?.grade || 'Not specified',
          pickup_point: { 
            name: pickupPointMapping[childName] || 'Not assigned'
          }
        };
      });
      
      console.log('✅ My children:', myChildren);
      setChildren(myChildren);
      
    } catch (error) {
      console.error('❌ Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning 🌅");
    else if (hour < 17) setGreeting("Good afternoon☀️");
    else setGreeting("Good evening🌙");

    const animateValue = (start, end, duration, setter) => {
      let range = end - start;
      let current = start;
      let increment = end > start ? 1 : -1;
      let stepTime = Math.abs(Math.floor(duration / range));
      const timer = setInterval(() => {
        current += increment;
        setter(current);
        if (current === end) clearInterval(timer);
      }, stepTime);
    };

    animateValue(0, 1, 1000, setBuses);
    animateValue(0, 1, 1000, setDrivers);
    animateValue(0, 1, 1000, setParents);

    fetchChildren();

    // ✅ REMOVED: The WebSocket connection is already handled in NotificationContext
    console.log('✅ Notification system managed by NotificationContext');

  }, [navigate]); // Removed addNotification from dependencies

  return (
    <div className="page-container" style={{ display: "flex", minHeight: "100vh", background: "var(--background)", color: "var(--text)" }}>

      <main className="main">
        <nav className="navbar">
          <div className="logo">TrackNGo</div>
          <div className="nav-right">
            <span className="greeting">{greeting}, {user?.username}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <NotificationBell />
              
              {/* Add Test Notification Button */}
            
              
              <button 
                onClick={handleLogout}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Rest of your Dashboard JSX remains the same */}
        <section className="dashboard">
          <div className="card">
            <div className="card-icon">🚌</div>
            <h3>Total Buses</h3>
            <p>{buses}</p>
          </div>

          <div className="card">
            <div className="card-icon">🧑‍✈️</div>
            <h3>Registered Drivers</h3>
            <p>{drivers}</p>
          </div>

          <div className="card">
            <div className="card-icon">👨‍👩‍👧‍👦</div>
            <h3>Parents Tracking</h3>
            <p>{parents}</p>
          </div>
        </section>

        {/* Children Information Section */}
        <section style={{ 
          padding: '2rem', 
          marginTop: '2rem',
          background: 'var(--white)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          margin: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ 
              color: 'var(--text)', 
              margin: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your Child Information
            </h2>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              {children.length} Child{children.length !== 1 ? 'ren' : ''}
            </div>
          </div>
          
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '3rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <p style={{ color: '#666', margin: 0 }}>Loading your child information...</p>
            </div>
          ) : children.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👶</div>
              <p style={{ color: '#64748b', margin: '0.5rem 0', fontSize: '1.1rem' }}>
                No children registered to your account
              </p>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                Contact administration if this seems incorrect.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1.5rem'
            }}>
              {children.map((child) => (
                <div key={child.id} style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '2px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                  }}></div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginRight: '1rem'
                    }}>
                      {child.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        color: 'var(--text)',
                        fontSize: '1.3rem'
                      }}>
                        {child.name}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        Grade {child.grade}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: '#f1f5f9',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    <p style={{ 
                      margin: '0.5rem 0', 
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ 
                        background: 'var(--primary)', 
                        color: 'white',
                        borderRadius: '4px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.8rem'
                      }}>📍</span>
                      <strong>Pickup Point:</strong> 
                      <span style={{ marginLeft: '0.5rem' }}>
                        {child.pickup_point?.name}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Debug Information */}
        <div style={{ 
          margin: '2rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔧 Debug Information</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            <div>
              <strong>User:</strong> {user?.username}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id}
            </div>
            <div>
              <strong>Children:</strong> {children.length}
            </div>
            <div>
              <strong>Notifications:</strong> {notifications.length}
            </div>
            <div>
              <strong>Unread:</strong> {unreadCount}
            </div>
            <div>
              <strong>Last Update:</strong> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </main>

      {/* Add CSS animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;