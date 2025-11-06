// contexts/NotificationContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // SAFE data access function
  const getNotificationData = (notification) => {
    return {
      id: notification.id,
      type: notification.type || 'general',
      message: notification.message || 'No message',
      timestamp: notification.timestamp || new Date().toISOString(),
      status: notification.notification_status || 'sent',
      child: notification.child,
      parent: notification.parent
    };
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
      
      setNotifications(userNotifications);
      
      // Calculate unread count - SAFE version
      const unread = userNotifications.filter(notification => {
        const data = getNotificationData(notification);
        return data.status === 'sent';
      }).length;
      
      setUnreadCount(unread);
      
      console.log(`📊 Loaded ${userNotifications.length} notifications, ${unread} unread`);
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

  // Mark as read
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

  // Mark all as read
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

      // Refresh notifications every 30 seconds as backup
      const interval = setInterval(loadNotifications, 30000);

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
    addNotification
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