async function analyzeRepo() {
    const repoUrl = document.getElementById("repoUrl").value.trim();
    const result = document.getElementById("result");

    if (!repoUrl) {
        alert("Please enter a GitHub Repository URL.");
        return;
    }

    result.innerHTML = "⏳ Analyzing...";

    try {
        const response = await fetch("https://ai-repo-summarizer.onrender.com/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ repo: repoUrl })
        });

        const data = await response.json();

        result.innerHTML = data.summary || data.error;

    } catch (err) {
        result.innerHTML = err.message;
    }
}
document.getElementById("analyzeBtn").addEventListener("click", analyzeRepo);