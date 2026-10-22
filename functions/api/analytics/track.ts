/**
 * POST /api/analytics/track → 200 {"success":true}
 * GET  /api/analytics/track → 405 {"success":false,"error":"method_not_allowed"}
 *
 * 写入 D1 ANALYTICS_DB（账号内库名 po_chat_logs，id 见 wrangler.toml）
 * 前端 payload：eventName, site, appMode, page, path, referrer, source, medium,
 *              campaign, visitorId, sessionId, metadata
 */
import type { Env } from '../nodes/_shared';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS });
}

function clean(v: unknown, max: number): string {
  if (v == null) return '';
  return String(v).slice(0, max);
}

function cleanMetadata(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  try {
    const raw = JSON.stringify(v);
    if (raw.length > 2000) return { _truncated: true };
    return v as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function onRequest(context: EventContext<Env, string, {}>) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    return json({ success: false, error: 'method_not_allowed' }, 405);
  }

  if (request.method !== 'POST') {
    return json({ success: false, error: 'method_not_allowed' }, 405);
  }

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 8192) {
      return json({ success: false, error: 'payload_too_large' }, 413);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const eventName = clean(body.eventName || body.event || '', 64);
    if (!eventName) {
      return json({ success: false, error: 'missing_event' }, 400);
    }

    const path = clean(body.path || '', 240);
    const referrer = clean(body.referrer || '', 180);
    const source = clean(body.source || '', 80);
    const medium = clean(body.medium || '', 80);
    const campaign = clean(body.campaign || '', 120);
    const sessionId = clean(body.sessionId || '', 80);
    const visitorId = clean(body.visitorId || '', 80);
    const site = clean(body.site || '', 120);
    const appMode = clean(body.appMode || '', 40);
    const page = clean(body.page || '', 120);

    const metadata = {
      ...cleanMetadata(body.metadata),
      ...(visitorId ? { visitorId } : {}),
      ...(site ? { site } : {}),
      ...(appMode ? { appMode } : {}),
      ...(page ? { page } : {}),
    };

    const db = env.ANALYTICS_DB;
    if (db) {
      const write = db
        .prepare(
          `INSERT INTO analytics_events
            (event_name, path, referrer, source, medium, campaign, session_id, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          eventName,
          path,
          referrer,
          source,
          medium,
          campaign,
          sessionId,
          JSON.stringify(metadata),
        )
        .run();

      // 不阻塞响应用户；写失败也不影响前端
      const waitUntil = (context as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil;
      if (typeof waitUntil === 'function') {
        waitUntil(Promise.resolve(write).catch(() => {}));
      } else {
        try {
          await write;
        } catch {
          /* ignore */
        }
      }
    }

    // 与线上一致：成功体为 {"success":true}（无 data 包裹）
    return json({ success: true });
  } catch {
    return json({ success: false, error: 'bad_request' }, 400);
  }
}
