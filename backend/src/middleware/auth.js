import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    // Try API token first (longer path, no JWT overhead)
    try {
      const userByApiToken = await User.findOne({ apiToken: token }).select('-password');
      if (userByApiToken) {
        if (userByApiToken.isDeleted) {
          return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
        }
        req.user = userByApiToken;
        return next();
      }
    } catch (error) {
      // Not an API token, fall through to JWT
    }

    // Try JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isDeleted) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};