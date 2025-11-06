import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import notificationService from '../services/notificationService';

export const DebugNotificationSystem = () => {
  const { notifications, unreadCount, isConnected } = useNotifications();
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h4>🔔 Debug Info</h4>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Total Notifications: {notifications.length}</p>
      <p>Unread: {unreadCount}</p>
      <p>Active Handlers: {notificationService.messageHandlers.size}</p>
      <p>Service Connected: {notificationService.isConnected ? '✅' : '❌'}</p>
      <p>Current Parent: {notificationService.currentParentId || 'None'}</p>
      
      <div style={{ marginTop: '10px' }}>
        <h5>Latest Notifications:</h5>
        {notifications.slice(0, 3).map((notif, index) => (
          <div key={index} style={{ 
            padding: '5px', 
            margin: '2px 0', 
            background: '#fff', 
            borderRadius: '3px',
            fontSize: '10px'
          }}>
            {notif.attributes?.message || notif.message}
          </div>
        ))}
      </div>
    </div>
  );
};