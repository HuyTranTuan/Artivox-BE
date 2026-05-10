const notfoundMiddleware = (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
    path: req.path,
  });
};

module.exports = { notfoundMiddleware };
