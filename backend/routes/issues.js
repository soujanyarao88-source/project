const express = require("express");
const { randomUUID } = require("node:crypto");
const supabase = require("../supabase");
const { createIssueLimiter } = require("../utils/limiters");

const router = express.Router();
const CATEGORIES = ["Roads & potholes", "Garbage & sanitation", "Water supply", "Streetlights", "Drainage", "Public safety", "Other"];
const clean = value => typeof value === "string" ? value.trim() : "";

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("issues")
      .select("id,title,category,location,description,status,resolution_note,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ issues: data || [] });
  } catch (error) { next(error); }
});

router.post("/", createIssueLimiter, async (req, res, next) => {
  try {
    const title = clean(req.body.title);
    const category = clean(req.body.category);
    const location = clean(req.body.location);
    const description = clean(req.body.description);
    const reporterName = clean(req.body.reporter_name);
    const contact = clean(req.body.contact);

    if (!title || !category || !location || !description) {
      return res.status(400).json({ error: "Title, category, location, and description are required." });
    }
    if (title.length > 100 || location.length > 160 || description.length > 1500 ||
        reporterName.length > 80 || contact.length > 100) {
      return res.status(400).json({ error: "One or more fields exceed the allowed length." });
    }
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: "Choose a valid issue category." });

    const record = {
      id: randomUUID(), title, category, location, description,
      reporter_name: reporterName || null, contact: contact || null, status: "Pending"
    };
    const { data, error } = await supabase.from("issues")
      .insert(record)
      .select("id,title,category,location,description,status,created_at")
      .single();
    if (error) throw error;
    return res.status(201).json({ issue: data });
  } catch (error) { next(error); }
});

module.exports = router;
