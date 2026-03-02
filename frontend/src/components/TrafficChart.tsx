"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState, useEffect } from "react";

export default function TrafficChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/traffic");
        if (response.ok) {
          const result = await response.json();
          setData(result.traffic_data);
        }
      } catch (error) {
        console.error("Failed to fetch traffic:", error);
      }
    };

    fetchTraffic();
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
            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
            itemStyle={{ color: "#fff" }}
          />
          <Line 
            type="monotone" 
            dataKey="requests" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#10b981", stroke: "#000", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
