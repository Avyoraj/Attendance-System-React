import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// CSS styles for the connection status indicator
const getStatusIndicatorStyle = (isOnline, visible) => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  zIndex: 1000,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: isOnline ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)',
  color: 'white',
  opacity: visible ? '1' : '0',
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  pointerEvents: visible ? 'auto' : 'none'
});

const getStatusDotStyle = (isOnline) => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#fff'
});

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(false);
  const [hasReconnected, setHasReconnected] = useState(false);

  useEffect(() => {
    // Function to handle online status change
    const handleOnlineStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setVisible(true);
      
      // If we're coming back online after being offline
      if (online && !isOnline) {
        setHasReconnected(true);
        toast.success('Connection restored! Refreshing data...');
        
        // Trigger cache invalidation for fresh data
        try {
          // Use window.location.reload() to refresh data instead of direct cache access
          // This is more reliable than trying to access the AuthContext from outside a component
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.log('Error refreshing data:', error);
        }
      } else if (!online) {
        toast.error('Connection lost. Working offline...');
      }
      
      // Hide the indicator after 5 seconds
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    // Add event listeners
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Check connection on mount
    handleOnlineStatusChange();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [isOnline]);

  // Function to manually check connection
  const checkConnection = () => {
    // Make a lightweight request to verify actual connectivity
    fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        if (!isOnline) {
          setIsOnline(true);
          toast.success('Connection verified!');
        }
      })
      .catch(() => {
        if (isOnline) {
          setIsOnline(false);
          toast.error('Server connection failed!');
        }
      });
  };

  return (
    <div 
      style={getStatusIndicatorStyle(isOnline, visible)}
      onClick={checkConnection}
      title="Click to check connection"
    >
      <div style={getStatusDotStyle(isOnline)} />
      {isOnline ? 'Connected' : 'Offline'}
    </div>
  );
};

export default ConnectionStatus;