/**
 * POST /api/nodes/reset — 重置为 Seed 初始数据（需 X-Admin-Token）
 * 警告：仓内 SEED 是旧的 N-001…，线上生产是 F02/Q06…，切勿对 production KV 误调。
 */
import { ok, err, preflight, requireAdmin, kvSaveNodes, SEED_NODES, type Env } from './_shared';

export async function onRequest(context: EventContext<Env, string, {}>) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return preflight();
  if (request.method !== 'POST') return err('Method not allowed', 405);

  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const kv = env.NODES_KV;
  if (!kv) return err('KV storage not configured', 503);

  await kvSaveNodes(kv, SEED_NODES);
  return ok(SEED_NODES);
}
