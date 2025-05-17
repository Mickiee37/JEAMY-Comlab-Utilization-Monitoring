import mongoose from "mongoose";

const connect = async () => {
    try{
        await mongoose.connect(process.env.MONGODB)
    }catch(error){
        console.log(error);
    }
}

// MongoDB connection event listeners
mongoose.connection.on("disconnected", () => {
    console.log("Disconnected from MongoDB");
});

mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
});

export default connect;
