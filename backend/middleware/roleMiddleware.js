// backend/middleware/roleMiddleware.js

// Middleware to check if user has required role(s)
const roleMiddleware = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
      }
      next();
    };
  };
  
  module.exports = roleMiddleware;
  