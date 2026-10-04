import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const startTime = Date.now();
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: "HEALTHY",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: "CONNECTED",
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "UNHEALTHY",
        timestamp: new Date().toISOString(),
        database: {
          status: "DISCONNECTED",
        },
      },
      { status: 503 }
    );
  }
}
