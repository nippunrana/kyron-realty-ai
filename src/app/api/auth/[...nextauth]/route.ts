import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/base-path";

function wrapRequest(req: NextRequest): NextRequest {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(BASE_PATH)) {
    url.pathname = `${BASE_PATH}${url.pathname}`;
    return new NextRequest(url, req);
  }
  return req;
}

export async function GET(req: NextRequest) {
  return handlers.GET(wrapRequest(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(wrapRequest(req));
}

