import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the notification context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: uuidv4(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      time: 'Just now',
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Update time display for all notifications
    updateNotificationTimes();
    
    return newNotification.id;
  };

  // Remove a notification by ID
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Update the relative time display for all notifications
  const updateNotificationTimes = () => {
    setNotifications(prev => 
      prev.map(notification => ({
        ...notification,
        time: getRelativeTime(notification.timestamp)
      }))
    );
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Update notification times periodically
  useEffect(() => {
    const interval = setInterval(updateNotificationTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};