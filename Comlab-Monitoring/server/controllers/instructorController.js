
import Instructor from "../models/instructor.js";

// Get all instructors
const getInstructors = async (req, res) => {
    try {
        const instructors = await Instructor.find();
        console.log(instructors);
        res.status(200).json(instructors);
    } catch (error) {
        console.error("Error fetching instructors:", error);
        res.status(500).json({ message: "Failed to fetch instructors" });
    }
};

const getInstructor = async (req, res) => {
    try {
      const instructor = await Instructor.findOne({ id: req.params.id });
      if (!instructor) {
        return res.status(404).json({ message: 'Instructor does not exist.' });
      }
      res.status(200).json(instructor);
    } catch (error) {
      console.error('Error fetching instructor:', error.message);
      res.status(500).json({ message: 'Server error while fetching instructor.' });
    }
  };
// Add a new instructor
const postInstructor = async (req, res) => {
    try {
        
        const { id, name, lastname, email } = req.body;
        if (!id, !name || !lastname || !email) {
            return res.status(400).json({ message: "Missing required fields: name, lastname, and email" });
        }
        const existingInstructor = await Instructor.findOne({ email });
        if (existingInstructor) {
            return res.status(400).json({ message: "Instructor with this email already exists" });
        }
        const instructor = new Instructor(req.body);
        const savedInstructor = await instructor.save();
        res.status(201).json(savedInstructor); 
    } catch (error) {
        console.error("Error adding instructor:", error);
        res.status(500).json({ message: "Failed to add instructor" });
    }
};

const deleteInstructor = async (req, res) => {
    try {
        const { id } = req.params; 
        const deletedInstructor = await Instructor.findOneAndDelete({ id });

        if (!deletedInstructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        res.status(200).json({ message: "Instructor deleted successfully", instructor: deletedInstructor });
    } catch (error) {
        console.error("Error deleting instructor:", error);
        res.status(500).json({ message: "Failed to delete instructor" });
    }
};

const updateInstructor = async (req, res) => {
    try {
        const { id } = req.params; 
        const updateData = req.body; 

        const updatedInstructor = await Instructor.findOneAndUpdate(
            { id }, 
            updateData, 
            { new: true }
        );

        if (!updatedInstructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        res.status(200).json({ message: "Instructor updated successfully", instructor: updatedInstructor });
    } catch (error) {
        console.error("Error updating instructor:", error);
        res.status(500).json({ message: "Failed to update instructor" });
    }
};


export { getInstructors, getInstructor, postInstructor, deleteInstructor, updateInstructor };
