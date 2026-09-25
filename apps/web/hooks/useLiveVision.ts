import { useState, useEffect, useCallback, useRef } from "react";

export interface LaneTelemetry {
  id: string;
  name: string;
  status: "ACTIVE" | "MAINTENANCE" | "IDLE" | "OFFLINE";
  shooterName?: string;
  targetDistance?: number;
  lastShotScore?: number;
  totalScore?: number;
  heartRate?: number;
  breathingRate?: number;
  airPressure?: number;
}

export function useLiveVision(rangeId: string = "1") {
  const [lanes, setLanes] = useState<LaneTelemetry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "DISCONNECTED" | "RECONNECTING">("DISCONNECTED");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function fetchLanes() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/range-operations/${rangeId}/lanes`);
        if (res.ok) {
          const data = await res.json();
          setLanes(data);
          if (data.length > 0 && !selectedLaneId) {
            setSelectedLaneId(data[0].id);
          }
        } else {
          throw new Error("Failed to fetch lanes");
        }
      } catch (error) {
        console.warn("Using mock lane data due to fetch error:", error);
        const mockData: LaneTelemetry[] = [
          { id: "L-01", name: "Lane 1", status: "ACTIVE", shooterName: "Markus Rossi", targetDistance: 10, lastShotScore: 10.4, totalScore: 104.8, heartRate: 72, breathingRate: 16, airPressure: 198 },
          { id: "L-02", name: "Lane 2", status: "ACTIVE", shooterName: "Elena Rostova", targetDistance: 10, lastShotScore: 9.8, totalScore: 98.2, heartRate: 85, breathingRate: 18, airPressure: 150 },
          { id: "L-03", name: "Lane 3", status: "IDLE" },
          { id: "L-04", name: "Lane 4", status: "MAINTENANCE" }
        ];
        setLanes(mockData);
        if (!selectedLaneId) setSelectedLaneId(mockData[0].id);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLanes();
  }, [rangeId]);

  useEffect(() => {
    // Establish WebSocket connection for real-time telemetry updates
    const connectWs = () => {
      try {
        setWsStatus("RECONNECTING");
        const ws = new WebSocket(`ws://localhost:3001/ws/range/${rangeId}`);
        
        ws.onopen = () => {
          setWsStatus("CONNECTED");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "SHOT_DETECTED") {
              setLanes(prev => prev.map(lane => 
                lane.id === message.laneId ? { ...lane, lastShotScore: message.score, totalScore: (lane.totalScore || 0) + message.score } : lane
              ));
            } else if (message.type === "LANE_STATUS_CHANGE") {
              setLanes(prev => prev.map(lane =>
                lane.id === message.laneId ? { ...lane, status: message.status } : lane
              ));
            }
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        };

        ws.onclose = () => {
          setWsStatus("DISCONNECTED");
        };

        wsRef.current = ws;
      } catch (error) {
        console.warn("WebSocket connection failed, using local mocked polling as fallback", error);
        setWsStatus("DISCONNECTED");
      }
    };

    connectWs();

    // Mock polling if disconnected
    const interval = setInterval(() => {
      if (wsStatus === "DISCONNECTED") {
        setLanes(prev => prev.map(lane => {
          if (lane.status === "ACTIVE") {
            const randomShot = Math.random() > 0.7 ? (Math.random() * 2 + 8.9) : null;
            if (randomShot) {
              return { 
                ...lane, 
                lastShotScore: Number(randomShot.toFixed(1)),
                totalScore: (lane.totalScore || 0) + Number(randomShot.toFixed(1)),
                heartRate: (lane.heartRate || 70) + (Math.floor(Math.random() * 5) - 2),
                airPressure: Math.max(0, (lane.airPressure || 200) - 0.5)
              };
            }
          }
          return lane;
        }));
      }
    }, 3000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(interval);
    };
  }, [rangeId, wsStatus]);

  return { lanes, isLoading, selectedLaneId, setSelectedLaneId, wsStatus };
}
