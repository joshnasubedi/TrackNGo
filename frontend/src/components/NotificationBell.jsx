// components/NotificationBell.jsx
import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading, 
    refreshNotifications,
    clearAllNotifications,
    clearNotification
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pickup':
        return '🚌';
      case 'dropoff':
        return '🏫';
      case 'delay':
        return '⏰';
      case 'emergency':
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  // SAFE data access function
  const getNotificationData = (notification) => {
    return {
      id: notification.id,
      type: notification.attributes?.type || notification.type,
      message: notification.attributes?.message || notification.message,
      timestamp: notification.attributes?.timestamp || notification.timestamp,
      status: notification.attributes?.notification_status || notification.notification_status || 'sent'
    };
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    const data = getNotificationData(notification);
    
    if (data.status === 'sent') {
      console.log('📨 Marking notification as read:', notification.id);
      markAsRead(notification.id);
    }
  };

  // ✅ ADD THIS: Handle clear single notification
  const handleClearNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent marking as read
    if (window.confirm('Are you sure you want to delete this notification?')) {
      await clearNotification(notificationId);
    }
  };

  // ✅ ADD THIS: Handle clear all notifications
const handleClearAll = async () => {
  if (notifications.length === 0) {
    alert('No notifications to clear');
    return;
  }
  
  if (window.confirm(`Are you sure you want to clear all ${notifications.length} notifications?`)) {
    // Close the dropdown first
    setIsOpen(false);
    
    // Then call the clear function
    await clearAllNotifications();
    setShowClearConfirm(false);
  }
};

  // Check if notification is a test notification
  const isTestNotification = (notification) => {
    const data = getNotificationData(notification);
    return typeof data.id === 'number' && data.id > 1000000000000;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            refreshNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={refreshNotifications}
                className="text-sm text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                title="Refresh"
              >
                🔄
              </button>
          
              
            
            </div>
          </div>

          {/* ✅ ADD CLEAR CONFIRMATION */}
          {showClearConfirm && (
            <div className="p-3 bg-yellow-50 border-b">
              <p className="text-sm text-yellow-800 mb-2">
                Clear all {notifications.length} notifications?
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleClearAll}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-1 px-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => {
                const data = getNotificationData(notification);
                const isTest = isTestNotification(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer group relative ${
                      data.status === 'sent' ? 'bg-blue-50' : ''
                    } ${isTest ? 'border-l-4 border-l-green-500' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* ✅ ADD CLEAR BUTTON FOR EACH NOTIFICATION */}
                    <button
                      onClick={(e) => handleClearNotification(notification.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-opacity"
                      title="Delete notification"
                    >
                      ×
                    </button>
                    
                    <div className="flex items-start space-x-3 pr-6">
                      <span className="text-xl">
                        {getNotificationIcon(data.type)}
                        {isTest && ' 🧪'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {data.message}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">
                            {formatTime(data.timestamp)}
                          </p>
                          {isTest && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Test
                            </span>
                          )}
                        </div>
                      </div>
                      {data.status === 'sent' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with quick actions */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-600">
                {notifications.length} total, {unreadCount} unread
              </span>
            
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;