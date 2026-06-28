const buckets = new Map();

function rateLimit({ windowMs, max, key = defaultKey, message = 'Muitas requisicoes. Tente novamente mais tarde.' }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = key(req);
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

function defaultKey(req) {
  return `${req.ip}:${req.baseUrl}:${req.path}`;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

module.exports = { rateLimit };

