export function allowRead(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  res.setHeader('Allow', 'GET, HEAD');
  res.status(405).send('Method not allowed');
  return false;
}
