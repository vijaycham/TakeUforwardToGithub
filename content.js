// GitHub Configuration
const GITHUB_CONFIG = {
  token: "",
  owner: "vijaycham", // Update with your GitHub username
  repo: "Data-Structure-and-Algorithms", // Update with your repo name
  branch: "main", // Branch to push changes
};

// Initialize GitHub Config (prompt only if token is missing)
const initGitHubConfig = () => {
  GITHUB_CONFIG.token =
    localStorage.getItem("github_token") ||
    prompt("Enter your GitHub token (it will be stored securely):");
  GITHUB_CONFIG.owner =
    localStorage.getItem("github_owner") ||
    prompt("Enter your GitHub username:");
  GITHUB_CONFIG.repo =
    localStorage.getItem("github_repo") ||
    prompt("Enter your repository name:");

  // Save configurations in localStorage
  localStorage.setItem("github_token", GITHUB_CONFIG.token);
  localStorage.setItem("github_owner", GITHUB_CONFIG.owner);
  localStorage.setItem("github_repo", GITHUB_CONFIG.repo);
};

// Save Problem Details
let QUES = "";
let DESCRIPTION = "";

// Poll for problem details (with a timeout to avoid infinite loops)
const pollForQuestion = setInterval(() => {
  const headingElem = document.querySelector(".text-2xl.font-bold");
  const paragraphElem = document.querySelector("p.mt-6");
  if (headingElem && paragraphElem) {
    QUES = headingElem.textContent || "";
    DESCRIPTION = paragraphElem.textContent || "";
    clearInterval(pollForQuestion); // Stop polling
  }
}, 2000);

// GitHub API: Create or Update File
const createOrUpdateFile = async (filePath, content, commitMessage) => {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;
    const headers = {
      Authorization: `token ${GITHUB_CONFIG.token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Check if file exists
    const response = await fetch(url, { headers });
    const payload = {
      message: commitMessage,
      content: btoa(content), // Base64 encode the content
      branch: GITHUB_CONFIG.branch,
    };

    // If file exists, include the SHA for updating
    if (response.ok) {
      const data = await response.json();
      payload.sha = data.sha;
    }

    // Create or update file
    const result = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      throw new Error(`GitHub API error: ${result.status}`);
    }

    console.log("File successfully created/updated!");
    return true;
  } catch (error) {
    console.error("Error in createOrUpdateFile:", error);
    return false;
  }
};

// Handle Submission Push
const handleSubmissionPush = async (Sdata) => {
  try {
    if (!Sdata.success) return false;
    if (!GITHUB_CONFIG.token) initGitHubConfig();

    // Commit message and file content
    const commitMessage =
      `Solved: ${QUES}\n\n` + `Stats:\nSuccess: ${Sdata.success}`;
    const fileContent = `/*\nProblem: ${QUES}\nDescription:\n${DESCRIPTION}\n*/\n\n${PUBLIC_CODE}`;
    const filePath = `solutions/${PROBLEM_SLUG}/solution.${SELECTED_LANGUAGE}`;

    return await createOrUpdateFile(filePath, fileContent, commitMessage);
  } catch (error) {
    console.error("Error in handleSubmissionPush:", error);
    return false;
  }
};

// Interceptor Injection
const injectInterceptor = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("interceptor.js");
  document.head.appendChild(script);
  script.onload = () => script.remove();
};

// Monitor Submission Events
window.addEventListener("message", async (event) => {
  if (event.data.type === "SUBMISSION_RESPONSE") {
    const submissionData = event.data.payload;
    if (submissionData.success) {
      await handleSubmissionPush(submissionData);
    }
  }
});

// Initialize Features
injectInterceptor();
initGitHubConfig();
