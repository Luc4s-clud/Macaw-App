/**
 * Log de requisições HTTP (método, URL, status, duração).
 * Desative com REQUEST_LOG=false no .env.
 */

function shouldLog() {
  const v = process.env.REQUEST_LOG;
  if (v === 'false' || v === '0') return false;
  return true;
}

export function requestLogger() {
  return (req, res, next) => {
    if (!shouldLog()) {
      next();
      return;
    }
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
      console.log(line);
    });
    next();
  };
}
