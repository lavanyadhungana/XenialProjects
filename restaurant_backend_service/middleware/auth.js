import jwt from 'jsonwebtoken';   
const { verify } = jwt;

import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }
  verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

export function extractTokenDetails(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // no token — just continue
    return next();
  }

  verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;  // attach the payload
    }
    // either way, continue on
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin privileges required' });
}

function requireCustomer(req, res, next) {
  if (req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({ error: 'Customer only privileges required' });
}

export default {
  authenticateToken,
  requireAdmin,
  requireCustomer,
  extractTokenDetails,
  JWT_SECRET
};