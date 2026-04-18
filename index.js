import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//DB Connect
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

//MODELS 

//USER MODEL
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
});

const User = mongoose.model("User", userSchema);

// OLD HISTORY MODEL 
const historySchema = new mongoose.Schema({
  code: String,
  result: String,
  language: String,
  userId: String,
  createdAt: { type: Date, default: Date.now },
});

const History = mongoose.model("History", historySchema);

// LOGIN 

// UPDATED LOGIN (DB save + return id)
app.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    // create if not exists
    if (!user) {
      user = await User.create({ email });
    }

    res.json({
      userId: user._id,   
      email: user.email,
    });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

//ANALYZE

app.post("/analyze", async (req, res) => {
  try {
    const { code, language, userId } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are a strict code reviewer.

Respond ONLY in this format:

Improvements:
- point 1
- point 2

Optimized Code:
<only code here>
`,
          },
          {
            role: "user",
            content: `Analyze this ${language} code:\n${code}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content;

    // save only if logged in
    if (userId) {
      await History.create({ code, result, language, userId });
    }

    res.json({ result });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Error" });
  }
});

//HISTORY 

app.get("/history/:userId", async (req, res) => {
  const data = await History.find({ userId: req.params.userId })
    .sort({ createdAt: -1 });
  res.json(data);
});

app.delete("/history/:id", async (req, res) => {
  await History.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

app.delete("/history/user/:userId", async (req, res) => {
  await History.deleteMany({ userId: req.params.userId });
  res.json({ msg: "All deleted" });
});

app.listen(3000, () => console.log("Server running"));