document.addEventListener("DOMContentLoaded", () => {

    const analyzeBtn = document.getElementById("analyzeBtn");
    const result = document.getElementById("result");
    const repoUrlInput = document.getElementById("repoUrl");

    analyzeBtn.addEventListener("click", analyzeRepo);

    async function analyzeRepo() {
        const repoUrl = repoUrlInput.value.trim();

        if (!repoUrl) {
            alert("Please enter a GitHub Repository URL.");
            return;
        }

        result.innerHTML = "⏳ Analyzing... Please wait.";

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
                throw new Error("Server Error: " + response.status);
            }

            const data = await response.json();

            if (data.summary) {
                result.innerHTML = `<h3>📄 Summary</h3><p>${data.summary}</p>`;
            } else {
                result.innerHTML = `<p style="color:red;">${data.error || "No summary received."}</p>`;
            }

        } catch (error) {
            result.innerHTML = `<p style="color:red;">❌ ${error.message}</p>`;
        }
    }

});