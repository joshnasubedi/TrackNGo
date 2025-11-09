// ParentNotifications.jsx - FIXED VERSION
import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const ParentNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotificationData = (notification) => {
    // Handle both direct and nested attributes
    const attributes = notification.attributes || notification;
    return {
      id: notification.id,
      type: attributes.type,
      message: attributes.message,
      timestamp: attributes.timestamp || attributes.createdAt,
      status: attributes.notification_status || 'sent',
      childName: attributes.child?.data?.attributes?.name || 'Your child'
    };
  };

  if (loading) {
    return <div className="text-center p-4">Loading notifications...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Notifications {unreadCount > 0 && `(${unreadCount} new)`}</h2>
        {unreadCount > 0 && (
          <button style={styles.markAllButton} onClick={markAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No notifications yet</p>
          <p style={styles.emptySubtext}>You'll see notifications here when the driver updates your child's status</p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map((notification) => {
            const data = getNotificationData(notification);
            const isUnread = data.status === 'sent';
            
            return (
              <div
                key={notification.id}
                style={{
                  ...styles.notificationItem,
                  background: isUnread ? '#f0f8ff' : '#fff',
                  borderLeft: isUnread ? '4px solid #3b82f6' : '4px solid #d1d5db'
                }}
                onClick={() => isUnread && markAsRead(notification.id)}
              >
                <div style={styles.notificationContent}>
                  <p style={styles.message}>{data.message}</p>
                  <div style={styles.meta}>
                    <span style={styles.type}>{data.type}</span>
                    <span style={styles.timestamp}>
                      {formatDate(data.timestamp)}
                    </span>
                    {isUnread && (
                      <span style={styles.unreadBadge}>NEW</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e5e7eb'
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  markAllButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  emptySubtext: {
    fontSize: '14px',
    marginTop: '8px',
    color: '#9ca3af'
  },
  notificationsList: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  notificationItem: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  notificationContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  message: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#374151'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#6b7280'
  },
  type: {
    background: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'capitalize',
    fontWeight: '500'
  },
  timestamp: {
    color: '#9ca3af'
  },
  unreadBadge: {
    background: '#ef4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold'
  }
};

export default ParentNotifications;