import React, { useState } from 'react';
import './RoutesInfo.css';

const RoutesInfo = () => {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routes] = useState([
    {
      id: 1,
      name: "School Route",
      driver: "Krishna Rai",
      busNumber: "BA 1 PA 1234",
      status: "active",
      driver_age:32,
      students: 4,
      pickupPoints: [
        { lat: 27.7172, lng: 85.3240, name: "Child 1 - School Gate", time: "07:30 AM" },
        { lat: 27.7200, lng: 85.3200, name: "Child 2 - Park Area", time: "07:45 AM" },
        { lat: 27.7150, lng: 85.3280, name: "Child 3 - Main Road", time: "08:00 AM" },
        { lat: 27.7220, lng: 85.3220, name: "Child 4 - Community Center", time: "08:15 AM" }
      ]
    },

  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'scheduled': return '#f59e0b';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'scheduled': return 'Scheduled';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <div className="routes-container">
      <div className="routes-header">
        <h1>Bus Route Management</h1>
        <p>Manage and monitor all bus routes efficiently</p>
      </div>

      <div className="routes-content">
        <div className="routes-list">
          <h2>Available Routes</h2>
          <div className="route-cards">
            {routes.map(route => (
              <div 
                key={route.id}
                className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="route-header">
                  <h3>{route.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(route.status) }}
                  >
                    {getStatusText(route.status)}
                  </span>
                </div>
                <div className="route-details">
                  <div className="detail-item">
                    <i className="fas fa-bus"></i>
                    <span>{route.busNumber}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-user"></i>
                    <span>{route.driver}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>{route.students} students</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>{route.startTime} - {route.endTime}</span>
                  </div>
                </div>
                <div className="route-footer">
                  <span className="pickup-count">
                    {route.pickupPoints.length} pickup points
                  </span>
                  <button className="view-details-btn">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="route-detail-panel">
          {selectedRoute ? (
            <>
              <div className="detail-panel-header">
                <h2>{selectedRoute.name}</h2>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedRoute.status) }}
                >
                  {getStatusText(selectedRoute.status)}
                </span>
              </div>

              <div className="route-info-grid">
                <div className="info-card">
                  <i className="fas fa-bus"></i>
                  <div>
                    <h4>Bus Number</h4>
                    <p>{selectedRoute.busNumber}</p>
                  </div>
                </div>
                <div className="info-card">
                  <i className="fas fa-user"></i>
                  <div>
                    <h4>Driver</h4>
                    <p>{selectedRoute.driver}</p>
                  </div>
                </div>
                <div className="info-card">
                  <i className="fas fa-users"></i>
                  <div>
                    <h4>Students</h4>
                    <p>{selectedRoute.students}</p>
                  </div>
                </div>
                <div className="info-card">
                  <i className="fas fa-clock"></i>
                  <div>
                    <h4>Age</h4>
                    <p>{selectedRoute.driver_age}</p>
                  </div>
                </div>
              </div>

              <div className="pickup-points-section">
                <h3>Pickup Points</h3>
                <div className="pickup-points-list">
                  {selectedRoute.pickupPoints.map((point, index) => (
                    <div key={index} className="pickup-point-card">
                      <div className="point-number">{index + 1}</div>
                      <div className="point-details">
                        <h4>{point.name}</h4>
                        <p>Coordinates: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                        <span className="pickup-time">
                          <i className="fas fa-clock"></i>
                          {point.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="no-route-selected">
              <i className="fas fa-route"></i>
              <h3>Select a Route</h3>
              <p>Choose a bus route from the list to view detailed information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesInfo;