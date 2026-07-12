const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/summarize", async (req, res) => {
  try {
    const { repo } = req.body;

    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Summarize this GitHub repository:\n${repo}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({
      summary: result.choices[0].message.content,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;



if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;