console.log("✅ JS Connected");

const analyzeBtn = document.getElementById("analyzeBtn");

analyzeBtn.addEventListener("click", analyzeRepo);

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
            body: JSON.stringify({
                repo: repoUrl
            })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();

        console.log(data);

        if (data.summary) {
            result.innerHTML = data.summary;
        } else if (data.error) {
            result.innerHTML = "❌ " + data.error;
        } else {
            result.innerHTML = "⚠️ No response received.";
        }

    } catch (error) {

        console.error(error);

        result.innerHTML = "❌ " + error.message;
    }

}