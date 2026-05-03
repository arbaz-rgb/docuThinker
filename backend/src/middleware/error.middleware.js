const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const getErrorMessage = (err) => {
  if (err.code === 11000) {
    if (err.keyPattern?.email || err.keyValue?.email) {
      return "User already exists with this email";
    }

    return "Duplicate value already exists";
  }

  if (err.name === "ValidationError") {
    return Object.values(err.errors)
      .map((validationError) => validationError.message)
      .filter(Boolean)
      .join(". ");
  }

  return err.message || "Internal Server Error";
};

const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode || (err.code === 11000 ? 409 : err.name === "ValidationError" ? 400 : 500);
  const message = getErrorMessage(err);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
