import { useEffect, useRef, useState } from "react";

interface UseWebSocketProps {
  url: string;
}

export function useWebSocket({ url }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket");
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(message);
    }
  };

  return { messages, sendMessage, isConnected };
}
