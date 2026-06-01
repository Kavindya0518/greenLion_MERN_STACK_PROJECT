const express = require("express");
const ctrl = require("../Controllers/products.controller");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// ===== Multer Setup (PDF & Image Upload) =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

// Accept images and PDFs
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// ===== Routes =====
router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);

// Updated to accept `file` (image or PDF)
router.post("/", upload.single("file"), ctrl.create);
router.patch("/:id", upload.single("file"), ctrl.update);

router.delete("/:id", ctrl.remove);

// Admin utility: auto-link products to finished products by name
router.post("/link-inventory", ctrl.linkInventory);

module.exports = router;
