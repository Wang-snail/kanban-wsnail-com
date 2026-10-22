/**
 * GET /api/health
 * 健康检查：含 nodes 统计（total/published/minPublished/restored）
 * env: NODES_MIN_PUBLISHED、NODES_HEALTH_AUTORESTORE
 */
import { kvGetNodes, kvSaveNodes, SEED_NODES, type Env } from './nodes/_shared';

function isTruthy(v: string | undefined): boolean {
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.trim().toLowerCase());
}

export async function onRequest(context: EventContext<Env, string, {}>) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          Allow: 'GET, HEAD, OPTIONS',
        },
      },
    );
  }

  const minPublished = Math.max(0, parseInt(env.NODES_MIN_PUBLISHED || '10', 10) || 10);
  let total = 0;
  let published = 0;
  let restored = false;
  let error: string | null = null;

  try {
    const kv = env.NODES_KV;
    let nodes = kv ? await kvGetNodes(kv) : SEED_NODES;
    total = nodes.length;
    published = nodes.filter(n => n.status === 'published').length;

    // 发布数不足且开启自动恢复时，写入 SEED。
    // 警告：仓内 SEED 是旧 N-001…，与线上 F02/Q06… 不同；生产勿随意开启。
    if (kv && published < minPublished && isTruthy(env.NODES_HEALTH_AUTORESTORE)) {
      await kvSaveNodes(kv, SEED_NODES);
      nodes = SEED_NODES;
      total = nodes.length;
      published = nodes.filter(n => n.status === 'published').length;
      restored = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const cf = (request as Request & { cf?: { region?: string } }).cf;

  const body = {
    success: true,
    data: {
      status: error ? 'degraded' : 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      region: cf?.region ?? 'unknown',
      nodes: { total, published, minPublished, restored },
      error,
    },
  };

  return Response.json(body, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'no-store',
      Allow: 'GET, HEAD, OPTIONS',
    },
  });
}
