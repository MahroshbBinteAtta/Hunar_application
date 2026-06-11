import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (workerId) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    if (!workerId) return;

    const connect = () => {
      // Build WS URL relative to current location if hosted, or local default
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = `${protocol}//localhost:8000/ws/${workerId}`;
      const wsUrl = import.meta.env.VITE_WS_URL 
        ? `${import.meta.env.VITE_WS_URL}/ws/${workerId}` 
        : defaultWsUrl;

      console.log(`Connecting WebSocket to: ${wsUrl}`);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connection established successfully.");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket notification received:", data);
          setNotifications((prev) => [
            {
              id: Date.now(),
              received_at: new Date(),
              ...data
            },
            ...prev
          ]);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.current.onclose = (e) => {
        setIsConnected(false);
        console.log("WebSocket connection closed. Reconnect will be attempted in 3 seconds...", e.reason);
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
        ws.current.close();
      };
    };

    connect();

    // Clean up connections on unmount or workerId changes
    return () => {
      if (ws.current) {
        ws.current.onclose = null; // Prevent trigger loop on manual close
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [workerId]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { notifications, isConnected, clearNotifications };
};
export default useWebSocket;
