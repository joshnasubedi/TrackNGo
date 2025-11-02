import React, { useState, useEffect } from 'react';
import './InfoDriver.css';

const InfoDriver = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/drivers');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Drivers data:', data); // optional for debugging
      setDrivers(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Handles both flat and nested Strapi responses
  const getDriverAttribute = (driver, attribute, fallback = 'N/A') => {
    return (
      driver?.attributes?.[attribute] ||
      driver?.[attribute] ||
      fallback
    );
  };

  const getAvatarInitials = (driver) => {
    const name = getDriverAttribute(driver, 'Name', '');
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase() || 'DR';
  };

  if (loading) {
    return (
      <div className="driver-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading drivers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-container">
        <div className="error-message">
          <h3>⚠️ Error Loading Drivers</h3>
          <p>{error}</p>
          <button onClick={fetchDrivers} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-container">
      <div className="driver-header">
        <h1>🚗 Our Drivers</h1>
        <p>Meet our professional driving team</p>
        <div className="driver-count">
          {drivers.length} driver{drivers.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="drivers-grid">
        {drivers.map((driver) => (
          <div key={driver.id} className="driver-card">
            <div className="driver-avatar">
              {getAvatarInitials(driver)}
            </div>

            <div className="driver-info">
              <h3 className="driver-name">
                {getDriverAttribute(driver, 'Name', 'Unknown Driver')}
              </h3>

              <div className="driver-details">
                <div className="detail-item">
                  <span className="detail-label">Age</span>
                  <span className="detail-value">
                    {getDriverAttribute(driver, 'Age')}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">
                    {getDriverAttribute(driver, 'phoneNumber')}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value email">
                    {getDriverAttribute(driver, 'email')}
                  </span>
                </div>
              </div>
            </div>

            <div className="driver-status">
              <span className="status-badge available">Available</span>
            </div>
          </div>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="empty-state">
          <h3>No drivers found</h3>
          <p>Add some drivers in your Strapi admin panel</p>
        </div>
      )}
    </div>
  );
};

export default InfoDriver;
