import express from "express";
import DashboardLab from "../models/dashboardSchema.js"; // Import the DashboardLab model

const router = express.Router();

// Route to update the lab with the instructor's name, time-in, and date
router.put("/labs/:labNumber", async (req, res) => {
  try {
    const { labNumber } = req.params;
    const { instructorName, timeIn, date } = req.body;

    // Find the lab by labNumber and update the currentUser field
    const updatedLab = await DashboardLab.findOneAndUpdate(
      { labNumber },
      {
        currentUser: { name: instructorName, timeIn, date }
      },
      { new: true } // Returns the updated lab
    );

    if (!updatedLab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    res.json(updatedLab);
  } catch (error) {
    console.error("Error updating lab data:", error);
    res.status(500).json({ message: "Error updating lab data" });
  }
});

export default router;
