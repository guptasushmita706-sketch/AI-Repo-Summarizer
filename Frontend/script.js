const API_URL = "https://ai-repo-summarizer.onrender.com/summarize";

async function analyzeRepo(repoUrl) {
  if (!repoUrl) {
    throw new Error("Repository URL is required.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      repo: repoUrl
    })
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Repository analysis failed.");
  }

  return data;
}


function saveAnalysisResult(data, repoUrl) {
  localStorage.setItem(
    "analysisResult",
    JSON.stringify(data)
  );

  localStorage.setItem(
    "repoUrl",
    repoUrl
  );
}


function getSavedRepoUrl() {
  return localStorage.getItem("repoUrl") || "";
}


function getSavedAnalysis() {
  const data = localStorage.getItem("analysisResult");

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}


function clearAnalysis() {
  localStorage.removeItem("repoUrl");
  localStorage.removeItem("analysisResult");
    }
