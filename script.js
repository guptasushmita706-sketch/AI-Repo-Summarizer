alert("script.js loaded");
async function analyzeRepo() {
    const repoUrl = document.getElementById("repoUrl").value.trim();
    const result = document.getElementById("result");

    if (!repoUrl) {
        alert("Please enter a GitHub Repository URL.");
        return;
    }

    result.innerHTML = "⏳ Analyzing repository...";

    try {
        const response = await fetch("/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                repo: repoUrl
            })
        });

        const data = await response.json();

        if (data.summary) {
            result.innerHTML = data.summary;
        } else {
            result.innerHTML = "❌ " + (data.error || "Something went wrong.");
        }

    } catch (error) {
        result.innerHTML = "❌ Error: " + error.message;
    }
}