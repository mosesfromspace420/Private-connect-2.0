import { describe, it, expect } from "vitest";
import superjson from "superjson";

/**
 * Tests to debug tRPC input serialization
 * The issue is that mutations receive undefined input
 */

const API_BASE = "http://localhost:3000/api/trpc";

describe("tRPC Serialization Debug", () => {
  it("should test raw POST with JSON body", async () => {
    const input = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    };

    // Test 1: Raw JSON body
    const response1 = await fetch(`${API_BASE}/auth.signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    console.log("Test 1 - Raw JSON body:");
    console.log("Status:", response1.status);
    const data1 = await response1.json();
    console.log("Response:", JSON.stringify(data1, null, 2));
  });

  it("should test with superjson serialized body", async () => {
    const input = {
      email: "test2@example.com",
      username: "testuser2",
      password: "password123",
    };

    // Test 2: Superjson serialized
    const serialized = superjson.serialize(input);
    console.log("Superjson serialized:", JSON.stringify(serialized, null, 2));

    const response2 = await fetch(`${API_BASE}/auth.signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serialized),
    });

    console.log("Test 2 - Superjson serialized body:");
    console.log("Status:", response2.status);
    const data2 = await response2.json();
    console.log("Response:", JSON.stringify(data2, null, 2));
  });

  it("should test with tRPC batch format", async () => {
    const input = {
      email: "test3@example.com",
      username: "testuser3",
      password: "password123",
    };

    // Test 3: tRPC batch format with superjson
    const batchPayload = {
      "0": superjson.serialize(input),
    };

    const response3 = await fetch(`${API_BASE}/auth.signup?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchPayload),
    });

    console.log("Test 3 - tRPC batch format with superjson:");
    console.log("Status:", response3.status);
    const data3 = await response3.json();
    console.log("Response:", JSON.stringify(data3, null, 2));
  });

  it("should test with input query param for mutations", async () => {
    const input = {
      email: "test4@example.com",
      username: "testuser4",
      password: "password123",
    };

    // Test 4: Input as query param (like queries use)
    const serialized = superjson.serialize(input);
    const inputParam = encodeURIComponent(JSON.stringify(serialized));

    const response4 = await fetch(`${API_BASE}/auth.signup?input=${inputParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    console.log("Test 4 - Input as query param:");
    console.log("Status:", response4.status);
    const data4 = await response4.json();
    console.log("Response:", JSON.stringify(data4, null, 2));
  });

  it("should test with wrapped json body", async () => {
    const input = {
      email: "test5@example.com",
      username: "testuser5",
      password: "password123",
    };

    // Test 5: Wrapped in json key
    const wrapped = { json: input };

    const response5 = await fetch(`${API_BASE}/auth.signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wrapped),
    });

    console.log("Test 5 - Wrapped in json key:");
    console.log("Status:", response5.status);
    const data5 = await response5.json();
    console.log("Response:", JSON.stringify(data5, null, 2));
  });

  it("should test batch format with json wrapper", async () => {
    const input = {
      email: "test6@example.com",
      username: "testuser6",
      password: "password123",
    };

    // Test 6: Batch format with json wrapper (tRPC v11 format)
    const batchPayload = {
      "0": { json: input },
    };

    const response6 = await fetch(`${API_BASE}/auth.signup?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchPayload),
    });

    console.log("Test 6 - Batch format with json wrapper:");
    console.log("Status:", response6.status);
    const data6 = await response6.json();
    console.log("Response:", JSON.stringify(data6, null, 2));
  });

  it("should test superjson batch format with meta", async () => {
    const input = {
      email: "test7@example.com",
      username: "testuser7",
      password: "password123",
    };

    // Test 7: Full superjson format with meta
    const serialized = superjson.serialize(input);
    const batchPayload = {
      "0": serialized,
    };

    const response7 = await fetch(`${API_BASE}/auth.signup?batch=1`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-trpc-source": "test",
      },
      body: JSON.stringify(batchPayload),
    });

    console.log("Test 7 - Superjson batch with meta:");
    console.log("Status:", response7.status);
    const data7 = await response7.json();
    console.log("Response:", JSON.stringify(data7, null, 2));
  });
});
