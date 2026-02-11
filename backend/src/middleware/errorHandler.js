export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const isServerError = status >= 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: isServerError && isProduction
      ? 'Internal server error'
      : (err.message || 'Internal server error')
  });
}
