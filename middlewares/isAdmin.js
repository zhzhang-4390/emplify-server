module.exports = function (req, res, next) {
  if (req.session.user.role !== "admin") {
    return res.sendStatus(403);
  }
  next();
};
