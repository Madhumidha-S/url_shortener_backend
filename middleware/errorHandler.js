const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("API Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    status: err.statusCode,
    timestamp: new Date().toISOString(),
  });
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Internal Server Error";
  const errorCode = err.code || "INTERNAL_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      path: req.originalUrl,
      method: req.method,
    },
  });
};

module.exports = errorHandler;
