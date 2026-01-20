import type { Post, User } from "./types";

const API_BASE = "https://jsonplaceholder.typicode.com";

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPosts(limit = 5): Promise<Post[]> {
  await delay(1000); // Simulate slow network
  const response = await fetch(`${API_BASE}/posts?_limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
}

export async function fetchUsers(limit = 3): Promise<User[]> {
  await delay(1500); // Simulate slower network
  const response = await fetch(`${API_BASE}/users?_limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

export async function fetchWithError(): Promise<never> {
  await delay(500);
  throw new Error("Simulated network error!");
}
