const express = require("express");
const { timingSafeEqual } = require("node:crypto");
const supabase = require("../supabase");
const { requireAdmin } = require("../middleware/adminAuth");
const { loginLimiter } = require("../utils/limiters");

const router = express.Router();
const statuses = ["Pending", "In Progress", "Resolved"];
function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

router.post("/login", loginLimiter, (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  const supplied = typeof req.body.password === "string" ? req.body.password : "";
  if (!expected || expected.startsWith("replace_with_")) {
    return res.status(503).json({ error: "Admin password is not configured. Set ADMIN_PASSWORD in backend/.env." });
  }
  if (!safeEqual(supplied, expected)) return res.status(401).json({ error: "Incorrect administrator password." });
  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: "Could not start an admin session." });
    req.session.isAdmin = true;
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ error: "Could not save admin session." });
      return res.json({ message: "Administrator login successful." });
    });
  });
});

router.post("/logout", (req, res) => {
  if (!req.session) return res.json({ message: "Logged out." });
  req.session.destroy(error => {
    if (error) return res.status(500).json({ error: "Could not end the session." });
    res.clearCookie("civic.sid", { path: "/" });
    return res.json({ message: "Logged out." });
  });
});

router.get("/issues", requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("issues").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    res.json({ issues: data || [] });
  } catch (error) { next(error); }
});

router.patch("/issues/:id", requireAdmin, async (req, res, next) => {
  try {
    const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
    const resolutionNote = typeof req.body.resolution_note === "string" ? req.body.resolution_note.trim() : "";
    if (!statuses.includes(status)) return res.status(400).json({ error: "Choose a valid status." });
    if (resolutionNote.length > 500) return res.status(400).json({ error: "Resolution note must be 500 characters or fewer." });
    const { data, error } = await supabase.from("issues")
      .update({ status, resolution_note: resolutionNote || null, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("id,title,status,resolution_note,updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Issue not found." });
    res.json({ issue: data });
  } catch (error) { next(error); }
});

module.exports = router;
