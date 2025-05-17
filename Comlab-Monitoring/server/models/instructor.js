import mongoose from "mongoose";
const { Schema } = mongoose;

const instructorSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true, // Ensure id is unique
    },
    name: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    timeIn: {
      type: Date,
    },
    timeOut: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Instructor =
  mongoose.models.Instructor || mongoose.model("Instructor", instructorSchema);

export default Instructor;
