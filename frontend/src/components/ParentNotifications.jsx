import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const ParentNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotificationData = (notification) => {
    return {
      id: notification.id,
      type: notification.attributes?.type || notification.type,
      message: notification.attributes?.message || notification.message,
      timestamp: notification.attributes?.timestamp || notification.timestamp,
      status: notification.attributes?.notification_status || notification.notification_status || 'sent'
    };
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Notifications ({unreadCount} unread)</h2>
        {unreadCount > 0 && (
          <button style={styles.markAllButton} onClick={markAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map((notification) => {
            const data = getNotificationData(notification);
            return (
              <div
                key={notification.id}
                style={{
                  ...styles.notificationItem,
                  background: data.status === 'sent' ? '#f0f8ff' : '#fff'
                }}
                onClick={() => data.status === 'sent' && markAsRead(notification.id)}
              >
                <div style={styles.notificationContent}>
                  <p style={styles.message}>{data.message}</p>
                  <div style={styles.meta}>
                    <span style={styles.type}>{data.type}</span>
                    <span style={styles.timestamp}>
                      {formatDate(data.timestamp)}
                    </span>
                    {data.status === 'sent' && (
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
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  markAllButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  notificationsList: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  notificationItem: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  notificationContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  message: {
    margin: '0 0 8px 0',
    fontSize: '14px'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#666'
  },
  type: {
    background: '#e0e0e0',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'capitalize'
  },
  timestamp: {
    color: '#999'
  },
  unreadBadge: {
    background: '#ff4757',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px'
  }
};

export default ParentNotifications;