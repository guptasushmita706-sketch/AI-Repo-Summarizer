const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


/* -----------------------------
   GITHUB URL PARSER
----------------------------- */

function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);

    if (url.hostname !== "github.com") {
      throw new Error("Only GitHub repository URLs are supported.");
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL.");
    }

    return {
      owner: parts[0],
      repo: parts[1].replace(".git", "")
    };

  } catch (error) {
    throw new Error("Invalid GitHub repository URL.");
  }
}


/* -----------------------------
   GET REPOSITORY INFORMATION
----------------------------- */

async function getRepository(owner, repo) {

  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "AI-Repo-Summarizer"
      }
    }
  );

  return response.data;
}


/* -----------------------------
   GET COMPLETE FILE TREE
----------------------------- */

async function getRepositoryTree(owner, repo, branch) {

  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "AI-Repo-Summarizer"
      }
    }
  );

  return response.data.tree || [];
}


/* -----------------------------
   GET FILE CONTENT
----------------------------- */

async function getFileContent(owner, repo, path) {

  try {

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "AI-Repo-Summarizer"
        }
      }
    );

    if (!response.data.content) {
      return "";
    }

    return Buffer
      .from(response.data.content, "base64")
      .toString("utf-8");

  } catch (error) {

    return "";
  }
}


/* -----------------------------
   TECHNOLOGY DETECTION
----------------------------- */

function detectTechnologies(files) {

  const technologies = new Set();

  const fileNames = files.map(file =>
    file.path.toLowerCase()
  );

  if (fileNames.some(f => f.endsWith(".js"))) {
    technologies.add("JavaScript");
  }

  if (fileNames.some(f => f.endsWith(".ts"))) {
    technologies.add("TypeScript");
  }

  if (fileNames.some(f => f.endsWith(".html"))) {
    technologies.add("HTML");
  }

  if (fileNames.some(f => f.endsWith(".css"))) {
    technologies.add("CSS");
  }

  if (fileNames.some(f => f.includes("package.json"))) {
    technologies.add("Node.js");
  }

  if (fileNames.some(f => f.includes("express"))) {
    technologies.add("Express.js");
  }

  if (fileNames.some(f => f.includes("requirements.txt"))) {
    technologies.add("Python");
  }

  if (fileNames.some(f => f.includes("manage.py"))) {
    technologies.add("Django");
  }

  if (fileNames.some(f => f.includes("pom.xml"))) {
    technologies.add("Java / Maven");
  }

  if (fileNames.some(f => f.includes("dockerfile"))) {
    technologies.add("Docker");
  }

  if (fileNames.some(f => f.includes("vite.config"))) {
    technologies.add("Vite");
  }

  if (fileNames.some(f => f.includes("next.config"))) {
    technologies.add("Next.js");
  }

  if (fileNames.some(f => f.includes("react"))) {
    technologies.add("React");
  }

  if (fileNames.some(f => f.includes("requirements.txt"))) {
    technologies.add("Python");
  }

  return Array.from(technologies);
}


/* -----------------------------
   IMPORTANT FILE DETECTION
----------------------------- */

function findImportantFiles(files) {

  const importantNames = [
    "readme.md",
    "package.json",
    "server.js",
    "app.js",
    "index.js",
    "main.js",
    "index.html",
    "dockerfile",
    ".env.example",
    "requirements.txt"
  ];

  return files
    .filter(file => {
      const name = file.path
        .split("/")
        .pop()
        .toLowerCase();

      return importantNames.includes(name);
    })
    .slice(0, 15)
    .map(file => file.path);
}


/* -----------------------------
   BUILD REPOSITORY STRUCTURE
----------------------------- */

function buildStructure(files) {

  return files
    .filter(file => file.type === "blob")
    .slice(0, 150)
    .map(file => file.path)
    .join("\n");
}


/* -----------------------------
   AI ANALYSIS
----------------------------- */

async function generateAIAnalysis({
  repoInfo,
  structure,
  technologies,
  importantFiles,
  fileContents
}) {

  const prompt = `
You are an expert software architect performing an AI Repository X-Ray.

Analyze this GitHub repository.

Repository:
${repoInfo.full_name}

Description:
${repoInfo.description || "No description available"}

Primary Language:
${repoInfo.language || "Unknown"}

Technologies:
${technologies.join(", ") || "Not detected"}

Important Files:
${importantFiles.join("\n")}

Repository Structure:
${structure}

Selected File Contents:
${fileContents}

Return your answer in EXACTLY this JSON format:

{
  "summary": "Clear explanation of what this project does.",
  "technologies": ["technology1", "technology2"],
  "xray": "Explain how the major parts of this repository connect and work together.",
  "insights": "Give useful architectural insights, important files, possible risks and improvement suggestions."
}

Do not use markdown.
Return only valid JSON.
`;


  const completion = await groq.chat.completions.create({

    model: "llama-3.3-70b-versatile",

    messages: [
      {
        role: "system",
        content:
          "You are a senior software architect and repository analysis expert."
      },
      {
        role: "user",
        content: prompt
      }
    ],

    temperature: 0.2,

    max_tokens: 1800
  });


  const result =
    completion.choices?.[0]?.message?.content || "{}";


  try {

    return JSON.parse(result);

  } catch (error) {

    return {
      summary: result,
      technologies,
      xray:
        "The AI generated a repository explanation, but structured X-Ray data could not be parsed.",
      insights:
        "Review the repository structure and important files for deeper analysis."
    };
  }
}


/* -----------------------------
   MAIN ANALYZE ENDPOINT
----------------------------- */

app.post("/summarize", async (req, res) => {

  try {

    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({
        error: "Repository URL is required."
      });
    }


    const { owner, repo: repoName } =
      parseGitHubUrl(repo);


    /* Repository information */

    const repoInfo =
      await getRepository(owner, repoName);


    /* Repository files */

    const tree =
      await getRepositoryTree(
        owner,
        repoName,
        repoInfo.default_branch
      );


    const files =
      tree.filter(file => file.type === "blob");


    /* Technologies */

    const technologies =
      detectTechnologies(files);


    /* Important files */

    const importantFiles =
      findImportantFiles(files);


    /* Project structure */

    const structure =
      buildStructure(files);


    /* Read selected files */

    const selectedFiles =
      importantFiles.slice(0, 8);


    const fileResults = [];

    for (const file of selectedFiles) {

      const content =
        await getFileContent(
          owner,
          repoName,
          file
        );

      if (content) {

        fileResults.push(
          `\n--- ${file} ---\n${content.slice(0, 6000)}`
        );

      }

    }


    const fileContents =
      fileResults.join("\n");


    /* AI */

    const ai =
      await generateAIAnalysis({
        repoInfo,
        structure,
        technologies,
        importantFiles,
        fileContents
      });


    /* Final response */

    res.json({

      repoName: repoInfo.full_name,

      description:
        repoInfo.description || "",

      language:
        repoInfo.language || "Unknown",

      stars:
        repoInfo.stargazers_count,

      forks:
        repoInfo.forks_count,

      files:
        files.length,

      technologies:
        ai.technologies || technologies,

      importantFiles,

      structure,

      summary:
        ai.summary,

      xray:
        ai.xray,

      insights:
        ai.insights,

      githubUrl:
        repoInfo.html_url

    });


  } catch (error) {

    console.error("Analysis Error:", error.message);


    res.status(500).json({

      error:
        error.response?.data?.message ||
        error.message ||
        "Repository analysis failed."

    });

  }

});


/* -----------------------------
   HEALTH CHECK
----------------------------- */

app.get("/", (req, res) => {

  res.json({
    status: "online",
    message: "AI Repo Summarizer API is running 🚀"
  });

});


/* -----------------------------
   START SERVER
----------------------------- */

app.listen(PORT, () => {

  console.log(
    `AI Repo Summarizer running on port ${PORT}`
  );

});
