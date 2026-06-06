/**
 * @desc    Global error handling middleware
 * @param   {Error} err - Error object
 * @param   {Object} req - Express request
 * @param   {Object} res - Express response
 * @param   {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the stack trace if not in production
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Set default status code to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
