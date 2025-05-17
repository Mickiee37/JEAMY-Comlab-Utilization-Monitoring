import express from "express"
import {getInstructors, getInstructor, postInstructor, deleteInstructor, updateInstructor} from "../controllers/instructorController.js"
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - Get a specific instructor (used for QR login)
router.get("/:id", getInstructor);

// Protected routes - require admin access
// Get all instructors
router.get("/", authenticateToken, isAdmin, getInstructors);

// Add a new instructor
router.post("/", authenticateToken, isAdmin, postInstructor);

// Update an instructor
router.put("/:id", authenticateToken, isAdmin, updateInstructor);

// Delete an instructor
router.delete("/:id", authenticateToken, isAdmin, deleteInstructor);

export default router;