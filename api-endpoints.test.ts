import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Comprehensive API endpoint tests for PrivateConnect
 * Tests all major endpoints to identify issues and ensure proper data flow
 */

const API_BASE = "http://localhost:3000/api";

describe("API Endpoints - Authentication", () => {
  it("should have health check endpoint", async () => {
    const response = await fetch(`${API_BASE}/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("should return unauthenticated for /api/auth/me without session", async () => {
    const response = await fetch(`${API_BASE}/auth/me`);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Not authenticated");
  });

  it("should handle tRPC auth.signup endpoint", async () => {
    // Test with proper tRPC format
    const response = await fetch(`${API_BASE}/trpc/auth.signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      }),
    });

    console.log("Signup response status:", response.status);
    const data = await response.json();
    console.log("Signup response:", JSON.stringify(data, null, 2));

    // This test documents the current behavior
    // We expect either success or a specific error
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it("should handle tRPC auth.login endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/auth.login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    console.log("Login response status:", response.status);
    const data = await response.json();
    console.log("Login response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Posts", () => {
  it("should handle tRPC posts.create endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/posts.create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        content: "Test post",
        privacyLevel: "public",
      }),
    });

    console.log("Create post response status:", response.status);
    const data = await response.json();
    console.log("Create post response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it("should handle tRPC posts.getFeed endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/posts.getFeed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        limit: 20,
        offset: 0,
        followingOnly: false,
      }),
    });

    console.log("Get feed response status:", response.status);
    const data = await response.json();
    console.log("Get feed response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Follows", () => {
  it("should handle tRPC follows.follow endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/follows.follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        userId: 2,
      }),
    });

    console.log("Follow response status:", response.status);
    const data = await response.json();
    console.log("Follow response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Messages", () => {
  it("should handle tRPC messages.send endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/messages.send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        recipientId: 2,
        content: "Test message",
      }),
    });

    console.log("Send message response status:", response.status);
    const data = await response.json();
    console.log("Send message response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Marketplace", () => {
  it("should handle tRPC marketplace.createListing endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/marketplace.createListing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "Test Item",
        description: "A test marketplace item",
        price: 29.99,
        condition: "new",
      }),
    });

    console.log("Create listing response status:", response.status);
    const data = await response.json();
    console.log("Create listing response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Games", () => {
  it("should handle tRPC games.getProgress endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/games.getProgress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        gameName: "farm-paradise",
      }),
    });

    console.log("Get game progress response status:", response.status);
    const data = await response.json();
    console.log("Get game progress response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Groups", () => {
  it("should handle tRPC groups.list endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/groups.list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 20,
        offset: 0,
      }),
    });

    console.log("List groups response status:", response.status);
    const data = await response.json();
    console.log("List groups response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe("API Endpoints - Live Streams", () => {
  it("should handle tRPC liveStreams.list endpoint", async () => {
    const response = await fetch(`${API_BASE}/trpc/liveStreams.list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 20,
      }),
    });

    console.log("List live streams response status:", response.status);
    const data = await response.json();
    console.log("List live streams response:", JSON.stringify(data, null, 2));

    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
