const express = require("express");
const cors = require("cors");
require("dotenv").config();

const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Repo Summarizer Backend Running 🚀",
    endpoint: "/summarize",
  });
});

// Summarize API
app.post("/summarize", async (req, res) => {
  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        error: "Repository text is required.",
      });
    }

    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Summarize this GitHub repository:\n\n${repo}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({
      success: true,
      summary: result.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
