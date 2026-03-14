"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export default function TrafficChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial beautiful mock data curve
    const generateMockData = () => {
      const now = new Date();
      return Array.from({ length: 15 }).map((_, i) => {
        const time = new Date(now.getTime() - (14 - i) * 60000);
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          requests: Math.floor(Math.random() * 40) + 15 + (i % 3 === 0 ? 30 : 0), // some spikes
        };
      });
    };
    
    setData(generateMockData());

    const updateTraffic = () => {
      setData(prev => {
        if (prev.length === 0) return prev;
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newReqs = Math.floor(Math.random() * 40) + 15 + (Math.random() > 0.8 ? 50 : 0);
        return [...prev.slice(1), { time: newTime, requests: newReqs }];
      });
    };

    const fetchTraffic = async () => {
      try {
        const result = await fetchApi("/api/traffic");
        if (result.traffic_data && result.traffic_data.length > 0) {
           setData(result.traffic_data);
        } else {
           updateTraffic();
        }
      } catch {
        // Fallback to updating the mock chart live
        updateTraffic();
      }
    };

    const interval = setInterval(fetchTraffic, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            stroke="#52525b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#52525b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              borderColor: "#27272a",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="requests"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 6,
              fill: "#10b981",
              stroke: "#000",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
