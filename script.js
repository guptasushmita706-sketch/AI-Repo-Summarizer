function analyzeRepo() {
    let url = document.getElementById("repoUrl").value;

    if (url === "") {
        alert("Please enter a GitHub Repository URL.");
    } else {
        alert("Repository URL Submitted Successfully!");
    }
}
function analyzeRepo() {
    let repoUrl = document.getElementById("repoUrl").value;

    if (repoUrl === "") {
        alert("Please enter a GitHub Repository URL.");
        return;
    }

    alert("Repository URL Submitted Successfully!");
}