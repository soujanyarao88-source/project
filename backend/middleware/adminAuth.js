function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  return res.status(401).json({ error: "Administrator login is required." });
}
module.exports = { requireAdmin };
