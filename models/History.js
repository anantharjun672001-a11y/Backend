import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    code:{
        type: String,
    },
    result:{
        type: String,
    },
    language: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const History = mongoose.model("History", historySchema);
export default History;