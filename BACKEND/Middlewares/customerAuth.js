const jwt = require("jsonwebtoken");
const User = require("../Models/User");

// Middleware to ensure only customers can access cart routes
const customerOnly = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: `Cart access is restricted to customers only. Your role: ${req.user.role}`,
        redirectTo: req.user.role === 'admin' ? '/admin' : 
                   req.user.role === 'supplier' ? '/admin/suppliers' : 
                   req.user.role === 'employee' ? '/admin/employees' : '/'
      });
    }

    next();
  } catch (error) {
    console.error("Customer auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route"
    });
  }
};

module.exports = { customerOnly };