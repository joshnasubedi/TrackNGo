// contexts/NotificationContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ DEFINE THIS FUNCTION FIRST
  const getNotificationData = (notification) => {
    // Handle both direct properties and attributes structure
    return {
      id: notification.id,
      type: notification.attributes?.type || notification.type,
      message: notification.attributes?.message || notification.message,
      timestamp: notification.attributes?.timestamp || notification.timestamp,
      status: notification.attributes?.notification_status || notification.notification_status || 'sent',
      child: notification.attributes?.child || notification.child,
      parent: notification.attributes?.parent || notification.parent
    };
  };

  // ✅ FIXED: Debug function with safe method calls
  const debugNotificationFlow = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('🔍 NOTIFICATION DEBUG INFO:');
    console.log('👤 Current User:', user);
    console.log('🔑 User ID:', user?.id);
    console.log('👤 Username:', user?.username);
    
    // ✅ SAFE: Check if method exists before calling
    if (notificationService && typeof notificationService.getStatus === 'function') {
      console.log('📡 Notification Service Status:', notificationService.getStatus());
    } else {
      console.log('📡 Notification Service Status: getStatus method not available');
    }
    
    console.log('🔔 Active Handlers:', notificationService.messageHandlers?.size || 0);
    console.log('🔄 Is Connected:', notificationService.isConnected);
    console.log('⏰ Last Polled:', new Date().toLocaleTimeString());
  };

  // ✅ ADD THIS FUNCTION - For real-time notifications
  const addNotification = (newNotification) => {
    console.log('📨 addNotification called with:', newNotification);
    
    const notificationData = getNotificationData(newNotification);
    
    setNotifications(prev => {
      // Check if notification already exists to avoid duplicates
      const exists = prev.some(notif => notif.id === notificationData.id);
      if (exists) {
        console.log('⚠️ Notification already exists, skipping');
        return prev;
      }
      
      console.log('✅ Adding new notification to state');
      return [notificationData, ...prev];
    });
    
    setUnreadCount(prev => {
      console.log('🔔 Incrementing unread count');
      return prev + 1;
    });

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('TrackNGo', {
        body: notificationData.message,
        icon: '/bus-icon.png'
      });
    }
  };

  // Load existing notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        console.error('❌ No user found for loading notifications');
        setLoading(false);
        return;
      }

      console.log('👤 Loading notifications for user:', user.id, user.username);
      const userNotifications = await notificationService.getUserNotifications();
      console.log('📦 Raw notifications data:', userNotifications);
      
      // ✅ SORT NOTIFICATIONS: Newest first (by timestamp)
      const sortedNotifications = userNotifications.sort((a, b) => {
        const timeA = new Date(a.attributes?.timestamp || a.timestamp || 0);
        const timeB = new Date(b.attributes?.timestamp || b.timestamp || 0);
        return timeB - timeA; // Descending order (newest first)
      });
      
      setNotifications(sortedNotifications);
      
      // Calculate unread count
      const unread = sortedNotifications.filter(notification => {
        const data = getNotificationData(notification);
        return data.status === 'sent';
      }).length;
      
      setUnreadCount(unread);
      
      console.log(`📊 Loaded ${sortedNotifications.length} notifications, ${unread} unread`);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle new notification (for real-time updates)
  const handleNewNotification = (newNotification) => {
    console.log('📨 Real-time notification received in context:', newNotification);
    
    // Force refresh notifications from server
    loadNotifications();
    
    // Also try to add it locally
    const user = JSON.parse(localStorage.getItem('user'));
    const notificationParentId = newNotification.parent?.id;
    
    if (user && notificationParentId === user.id) {
      console.log('✅ Notification belongs to current user');
      addNotification(newNotification);
    }
  };

  // ✅ DEFINE markAsRead function
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif => {
          if (notif.id === notificationId) {
            return {
              ...notif,
              notification_status: 'read'
            };
          }
          return notif;
        })
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Failed to mark notification as read');
    }
  };

  // ✅ DEFINE markAllAsRead function
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => {
      const data = getNotificationData(notif);
      return data.status === 'sent';
    });
    
    try {
      for (const notif of unreadNotifications) {
        await notificationService.markAsRead(notif.id);
      }
      
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          notification_status: 'read'
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Failed to mark all notifications as read');
    }
  };

const clearAllNotifications = async () => {
  try {
    console.log('🗑️ Context: Starting clear all notifications...');
    
    // Show loading state
    setLoading(true);
    
    // Get current notifications count for comparison
    const currentNotificationCount = notifications.length;
    console.log(`📊 Current notifications: ${currentNotificationCount}`);
    
    if (currentNotificationCount === 0) {
      alert('No notifications to clear');
      setLoading(false);
      return;
    }
    
    // Call the clear all service
    const result = await notificationService.clearAllNotifications();
    console.log('📊 Clear all result:', result);
    
    if (result.success) {
      if (result.cleared > 0) {
        // ✅ FIXED: Clear local state immediately without reloading
        setNotifications([]);
        setUnreadCount(0);
        
        console.log(`✅ Cleared ${result.cleared} notifications`);
        alert(`✅ Successfully cleared ${result.cleared} notifications`);
      } else {
        console.log('ℹ️ No notifications were cleared');
        
        // ✅ FIXED: Check if there's a mismatch between local and server state
        if (currentNotificationCount > 0) {
          console.log('⚠️ Local has notifications but server says none to clear');
          console.log('🔄 Reloading to sync state...');
          await loadNotifications(); // Reload to see actual server state
        } else {
          alert('No notifications to clear');
        }
      }
    } else {
      console.error('❌ Clear all operation failed:', result.error);
      alert('Failed to clear notifications: ' + result.error);
    }
    
  } catch (error) {
    console.error('❌ Error clearing all notifications:', error);
    alert('Failed to clear notifications');
  } finally {
    setLoading(false);
  }
};

// ✅ FIXED: Clear single notification function
const clearNotification = async (notificationId) => {
  try {
    console.log(`🗑️ Context: Clearing single notification ${notificationId}`);
    
    // Remove from UI immediately for better UX
    const notificationToRemove = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    // Update unread count if needed
    if (notificationToRemove) {
      const data = getNotificationData(notificationToRemove);
      if (data.status === 'sent') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
    
    // Then call the API
    const result = await notificationService.deleteNotification(notificationId);
    
    if (result.success) {
      console.log(`✅ Notification ${notificationId} cleared successfully`);
      // Don't reload automatically to prevent reappearing
    } else {
      console.error(`❌ Failed to clear notification ${notificationId}`);
      // If API call failed, reload to restore the notification
      await loadNotifications();
      alert('Failed to delete notification');
    }
    
  } catch (error) {
    console.error(`❌ Error clearing notification ${notificationId}:`, error);
    // If error, reload to restore the notification
    await loadNotifications();
    alert('Failed to delete notification');
  }
};

// Add this function to NotificationContext for testing
const testClearFunctionality = async () => {
  console.log('🧪 TESTING CLEAR FUNCTIONALITY');
  
  // Test 1: Check current notifications
  console.log('📋 Current notifications:', notifications.length);
  console.log('📋 Current notifications data:', notifications);
  
  // Test 2: Check parent ID
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('👤 Current user:', user);
  
  // Test 3: Try to clear one notification manually
  if (notifications.length > 0) {
    const firstNotification = notifications[0];
    console.log('🧪 Testing clear on notification:', firstNotification);
    
    // Test the API call directly
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', !!token);
      
      const response = await fetch(`http://localhost:1337/api/notifications/${firstNotification.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🧪 Direct API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        console.log('🧪 DIRECT DELETE SUCCESS!');
      } else {
        const errorText = await response.text();
        console.log('🧪 DIRECT DELETE FAILED:', errorText);
      }
    } catch (error) {
      console.error('🧪 DIRECT DELETE ERROR:', error);
    }
  }
};

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (token && user) {
      console.log('🚀 Initializing notification system...');
      debugNotificationFlow(); // Debug info
      
      // Load existing notifications
      loadNotifications();
      
      // Request browser notification permission
      requestNotificationPermission();
      
      // ✅ FIXED: Connect to notification service properly
      const connectionSuccess = notificationService.connect();
      if (connectionSuccess) {
        // ✅ FIXED: Use the service's onMessage method directly
        notificationService.onMessage(handleNewNotification);
        setIsConnected(true);
        console.log('🔔 Notification system connected successfully');
      } else {
        console.error('❌ Failed to connect to notification service');
      }

      // ✅ FIXED: Reduce refresh interval to prevent reappearing notifications
      const interval = setInterval(loadNotifications, 60000); // 1 minute instead of 30 seconds

      return () => {
        console.log('🧹 Cleaning up notification system');
        clearInterval(interval);
        notificationService.disconnect();
        setIsConnected(false);
      };
    } else {
      console.log('❌ No user token found, skipping notification initialization');
      setLoading(false);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    markAllAsRead,
    loadNotifications,
    refreshNotifications: loadNotifications,
    addNotification,
    clearAllNotifications,
    clearNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};