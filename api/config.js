// Vercel Serverless: returns the Socket.io server URL for the game backend.
// Set SOCKET_SERVER_URL in Vercel env (e.g. your Railway app URL).
module.exports = async function handler(req, res) {
  const socketUrl = process.env.SOCKET_SERVER_URL || '';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).json({ socketUrl });
};
