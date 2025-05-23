chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateContent") {
    console.log("Generating content with request:", request);
    const apiKey = request.apiKey;
    const url = "https://api.dify.ai/v1/workflows/run";
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          basic_instruction: request.basicInstruction,
          background_detail: request.backgroundDetail || "",
          style: request.style || "",
        },
        user: "Chrome_Plugin",
      }),
    };

    // Start progress simulation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress > 90) {
        clearInterval(progressInterval);
        return;
      }
      // Update progress in popup
      chrome.runtime.sendMessage({
        action: "updateProgress",
        progress: progress
      });
    }, 1000);

    fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        clearInterval(progressInterval);
        console.log("Generated content data:", data);
        // Parse the output JSON string
        const parsedOutput = JSON.parse(data.data.outputs.output);
        
        // Fill content in the page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (data) => {
              // Fill content when success
              const titleInput = document.querySelector('.titleInput input[type="text"]');
              if (titleInput) {
                titleInput.value = data.title || "无标题";
                titleInput.dispatchEvent(new Event("input"));
              } else {
                console.error("Title input not found on the page.");
              }

              // 填充正文
              const editorContainer = document.querySelector(".ql-editor");
              if (editorContainer) {
                editorContainer.innerHTML = `<p>${data.body || "无正文"}</p>`;
                editorContainer.dispatchEvent(new Event("input"));
              } else {
                console.error("Editor container not found on the page.");
              }

              // 填充封面图片（如果需要）
              if (data.covers && data.covers.length > 0) {
                // TODO: Implement cover image upload logic
                console.log("Cover image URL:", data.covers[0]);
              }
            },
            args: [parsedOutput],
          });
        });

        // Update progress to 100% in popup
        chrome.runtime.sendMessage({
          action: "updateProgress",
          progress: 100
        });

        sendResponse({ status: "success", data: parsedOutput });
      })
      .catch((error) => {
        clearInterval(progressInterval);
        console.error("Error generating content:", error);
        
        // Update progress to show error in popup
        chrome.runtime.sendMessage({
          action: "updateProgress",
          progress: 0,
          error: error.message
        });

        sendResponse({ status: "error", message: error.message });
      });

    return true;
  }
});
