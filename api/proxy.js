// Vercel Serverless Function — CORS 代理
// 访问方式：GET /api/proxy?url=https://example.com
module.exports = async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: '缺少 url 参数' });
  }

  // 校验 URL 格式
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: '无效的 URL' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      return res.status(resp.status).json({ error: '目标网站返回 ' + resp.status });
    }

    const html = await resp.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300'); // CDN 缓存 5 分钟
    res.status(200).send(html);
  } catch (e) {
    const msg = e.name === 'AbortError' ? '请求超时' : e.message;
    res.status(502).json({ error: msg });
  }
};
