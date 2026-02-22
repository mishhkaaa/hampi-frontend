import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://sohraa-hms-production-803b.up.railway.app";

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  // Extract the path after /api/proxy/
  const path = url.pathname.replace(/^\/api\/proxy/, "");
  const targetUrl = `${BACKEND_URL}${path}${url.search}`;

  // Forward all headers except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });
  // Ensure cookies from the browser are forwarded to the backend
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // Forward body for non-GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) {
      fetchOptions.body = body;
    }
  }

  const backendResponse = await fetch(targetUrl, fetchOptions);

  // Build the response, forwarding status, body, and headers
  const responseBody = await backendResponse.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });

  // Forward response headers, but handle Set-Cookie specially
  // Headers.forEach merges Set-Cookie values incorrectly; use getSetCookie()
  backendResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || lower === "transfer-encoding" || lower === "content-encoding") {
      return; // handled separately or skipped
    }
    response.headers.set(key, value);
  });

  // Properly handle each Set-Cookie header individually
  const setCookies =
    typeof backendResponse.headers.getSetCookie === "function"
      ? backendResponse.headers.getSetCookie()
      : (backendResponse.headers.get("set-cookie") || "").split(/,(?=\s*\w+=)/);

  setCookies.forEach((cookie) => {
    if (!cookie.trim()) return;
    const adjusted = cookie
      .replace(/;\s*Secure/gi, "")
      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
      .replace(/;\s*Domain=[^;]*/gi, "")
      .replace(/;\s*Path=[^;]*/gi, "") // strip any existing Path
      + "; Path=/"; // ensure cookies are sent to ALL paths on localhost
    response.headers.append("Set-Cookie", adjusted);
  });

  return response;
}

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}
export async function POST(req: NextRequest) {
  return proxyRequest(req);
}
export async function PATCH(req: NextRequest) {
  return proxyRequest(req);
}
export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}
export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}
