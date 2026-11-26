// Cloudflare Pages Function: Server-side Site Publisher & Zero-Trust Auth Gate
// Secrets configured ONLY in Cloudflare Pages -> Settings -> Environment Variables (encrypted):
//   GITHUB_TOKEN           (Fine-grained PAT scoped to Handyman-tj/HandymanTJ Contents: Read & Write)
//   GITHUB_REPO            (default: "Handyman-tj/HandymanTJ")
//   GITHUB_BRANCH          (default: "main")
//   ADMIN_PASS             (Secret passphrase — NEVER committed to repo)
//   TOTP_SECRET            (Base32 Google Authenticator 30-sec secret — NEVER committed to repo)
//   CF_ACCESS_TEAM_DOMAIN  (Optional: e.g. "handymantj.cloudflareaccess.com")
//   CF_ACCESS_AUD          (Optional: Cloudflare Access Application Audience Tag)

const textEncoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = textEncoder.encode(a);
  const bb = textEncoder.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

function base32ToBytes(b32) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(b32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let val = 0;
  const out = [];
  for (const ch of clean) {
    val = (val << 5) | alpha.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((val >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

async function computeTotp(secretB32, counterOffset = 0) {
  const keyBytes = base32ToBytes(secretB32);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = Math.floor(Date.now() / 1000 / 30) + counterOffset;
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3];
  return String(bin % 1000000).padStart(6, '0');
}

async function verifyTotp(secretB32, code) {
  if (!secretB32 || !/^\d{6}$/.test(String(code || '').trim())) return false;
  for (const drift of [-1, 0, 1]) {
    const expected = await computeTotp(secretB32, drift);
    if (timingSafeEqual(expected, String(code).trim())) return true;
  }
  return false;
}

async function verifyCloudflareAccessJwt(request, env) {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt || !env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return false;
  try {
    const [hdrB64, payB64, sigB64] = jwt.split('.');
    if (!hdrB64 || !payB64 || !sigB64) return false;
    const decodeB64Url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
    const hdr = JSON.parse(decodeB64Url(hdrB64));
    const pay = JSON.parse(decodeB64Url(payB64));
    const now = Math.floor(Date.now() / 1000);
    if (!pay.exp || pay.exp < now) return false;
    const auds = Array.isArray(pay.aud) ? pay.aud : [pay.aud];
    if (!auds.includes(env.CF_ACCESS_AUD)) return false;
    const jwksRes = await fetch(`https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600 } });
    if (!jwksRes.ok) return false;
    const { keys } = await jwksRes.json();
    const jwk = (keys || []).find(k => k.kid === hdr.kid);
    if (!jwk) return false;
    const pubKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const sigRaw = Uint8Array.from(decodeB64Url(sigB64), c => c.charCodeAt(0));
    const data = textEncoder.encode(`${hdrB64}.${payB64}`);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pubKey, sigRaw, data);
  } catch {
    return false;
  }
}

async function authorizeRequest(request, env, bodyAuth = {}) {
  // Primary: Cloudflare Zero Trust Access verified JWT at edge
  if (await verifyCloudflareAccessJwt(request, env)) return true;

  // Secondary: Dynamic 30s TOTP + Secret Passphrase (configured in Cloudflare Secret Env Vars)
  const pass = bodyAuth.passphrase || request.headers.get('X-Admin-Pass') || '';
  const totp = bodyAuth.totp || request.headers.get('X-Admin-Code') || '';
  if (!env.ADMIN_PASS || !env.TOTP_SECRET) return false;
  if (!timingSafeEqual(pass, env.ADMIN_PASS)) return false;
  return await verifyTotp(env.TOTP_SECRET, totp);
}

async function ghApi(env, path, method = 'GET', body = null) {
  const repo = env.GITHUB_REPO || 'Handyman-tj/HandymanTJ';
  if (!env.GITHUB_TOKEN) throw new Error('Server secret not configured');
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HandymanTJ-Edge/1.0',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `GitHub ${res.status}`);
  return data;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const sub = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');

  if (sub === 'status' && request.method === 'GET') {
    const cfAuthed = await verifyCloudflareAccessJwt(request, env);
    return json({
      edgeReady: Boolean(env.GITHUB_TOKEN),
      cfAccessVerified: cfAuthed
    });
  }

  if (request.method !== 'POST') return json({ error: 'Forbidden' }, 403);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const ok = await authorizeRequest(request, env, payload.auth || {});
  if (!ok) return json({ error: 'Unauthorized' }, 403);

  const branch = env.GITHUB_BRANCH || 'main';

  if (sub === 'load') {
    try {
      const f = await ghApi(env, `/contents/data/site.json?ref=${encodeURIComponent(branch)}`);
      const raw = decodeURIComponent(escape(atob(f.content.replace(/\n/g, ''))));
      return json({ siteData: JSON.parse(raw), sha: f.sha });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (sub === 'publish') {
    try {
      const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
      if (uploads.length > 25) return json({ error: 'Too many files in one batch' }, 400);

      for (const item of uploads) {
        if (!/^assets\/projects\/(thumb|full)\/[a-zA-Z0-9_-]+\.webp$/.test(item.path)) {
          return json({ error: 'Invalid upload path' }, 400);
        }
        let existingSha;
        try { existingSha = (await ghApi(env, `/contents/${item.path}?ref=${encodeURIComponent(branch)}`)).sha; } catch {}
        await ghApi(env, `/contents/${item.path}`, 'PUT', {
          message: `edge upload ${item.path}`,
          content: item.base64,
          branch,
          ...(existingSha ? { sha: existingSha } : {})
        });
      }

      if (payload.siteData && typeof payload.siteData === 'object') {
        const jsonStr = JSON.stringify(payload.siteData, null, 2);
        const contentB64 = btoa(unescape(encodeURIComponent(jsonStr)));
        const cur = await ghApi(env, `/contents/data/site.json?ref=${encodeURIComponent(branch)}`).catch(() => null);
        await ghApi(env, '/contents/data/site.json', 'PUT', {
          message: 'site update via zero-trust manager',
          content: contentB64,
          branch,
          ...(cur ? { sha: cur.sha } : {})
        });
      }

      // Ping IndexNow automatically so Bing/ChatGPT Search re-indexes updates immediately
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'www.handymantj.com',
          key: '7f3a9b2c8d4e1f6a5b0c3d7e2f8a1b4c',
          keyLocation: 'https://www.handymantj.com/7f3a9b2c8d4e1f6a5b0c3d7e2f8a1b4c.txt',
          urlList: ['https://www.handymantj.com/']
        })
      }).catch(() => {});

      return json({ ok: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: 'Not found' }, 404);
}
