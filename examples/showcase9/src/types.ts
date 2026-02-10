export interface Metrics {
  activeUsers: number;
  requestsPerMin: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
}

export interface User {
  name: string;
  role: "admin" | "viewer";
}
