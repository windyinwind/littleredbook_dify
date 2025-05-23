document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded");
  console.log("Chrome object:", chrome);
  console.log("Chrome storage:", chrome?.storage);

  const generateButton = document.getElementById("generateButton");
  const basicInstructionInput = document.getElementById("basicInstruction");
  const backgroundDetailInput = document.getElementById("backgroundDetail");
  const styleInput = document.getElementById("style");
  const loading = document.getElementById("loading");
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsContent = document.getElementById("settingsContent");
  const apiKeyInput = document.getElementById("apiKey");
  const saveSettingsButton = document.getElementById("saveSettings");

  console.log("Settings elements:", { settingsToggle, settingsContent }); // Debug log

  // Listen for progress updates from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateProgress") {
      if (message.error) {
        loading.innerHTML = `<p style="color: var(--primary-color);">生成失败: ${message.error}</p>`;
        progressBarContainer.style.display = "none";
        generateButton.disabled = false;
      } else {
        progressBar.style.width = `${message.progress}%`;
        if (message.progress === 100) {
          loading.innerHTML = "<p>内容已生成并填充到小红书编辑器！</p>";
          setTimeout(() => {
            loading.classList.remove("active");
            progressBarContainer.style.display = "none";
            generateButton.disabled = false;
          }, 2000);
        }
      }
    }
  });

  // Load saved values
  try {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(
        {
          apiKey: "",
          basicInstruction: "生成的标题:",
          backgroundDetail: "",
          style: "",
        },
        (items) => {
          console.log("Loaded items:", items);
          apiKeyInput.value = items.apiKey;
          basicInstructionInput.value = items.basicInstruction;
          backgroundDetailInput.value = items.backgroundDetail;
          styleInput.value = items.style;
        }
      );
    } else {
      console.error("Chrome storage sync API not available");
      // Set default values directly
      apiKeyInput.value = "";
      basicInstructionInput.value = "";
      backgroundDetailInput.value = "";
      styleInput.value = "";
    }
  } catch (error) {
    console.error("Error loading saved values:", error);
  }

  // Toggle settings visibility
  if (settingsToggle && settingsContent) {
    settingsToggle.onclick = function() {
      console.log("Settings toggle clicked"); // Debug log
      settingsContent.classList.toggle("active");
      console.log("Settings content classList:", settingsContent.classList); // Debug log
    };
  } else {
    console.error("Settings elements not found"); // Debug log
  }

  // Save settings
  saveSettingsButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert("请输入 API Key");
      return;
    }

    try {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ apiKey }, () => {
          alert("设置已保存");
          settingsContent.classList.remove("active");
        });
      } else {
        console.error("Chrome storage sync API not available");
        alert("保存失败：存储API不可用");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("保存失败：" + error.message);
    }
  });

  // Save form values when they change
  function saveFormValues() {
    try {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.set({
          basicInstruction: basicInstructionInput.value,
          backgroundDetail: backgroundDetailInput.value,
          style: styleInput.value,
        });
      } else {
        console.error("Chrome storage sync API not available");
      }
    } catch (error) {
      console.error("Error saving form values:", error);
    }
  }

  basicInstructionInput.addEventListener("change", saveFormValues);
  backgroundDetailInput.addEventListener("change", saveFormValues);
  styleInput.addEventListener("change", saveFormValues);

  generateButton.addEventListener("click", () => {
    const basicInstruction = basicInstructionInput.value;
    const backgroundDetail = backgroundDetailInput.value;
    const style = styleInput.value;

    // Get API Key from storage
    try {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.get({ apiKey: "" }, (items) => {
          if (!items.apiKey) {
            alert("请先在设置中配置 API Key");
            settingsContent.classList.add("active");
            return;
          }

          console.log("Sending request to generate content with:", {
            basicInstruction,
            backgroundDetail,
            style,
          });

          // 显示加载效果和进度条
          loading.classList.add("active");
          loading.innerHTML = "<p>正在生成内容...</p>";
          progressBarContainer.style.display = "block";
          progressBar.style.width = "0%";
          generateButton.disabled = true;

          chrome.runtime.sendMessage(
            {
              action: "generateContent",
              apiKey: items.apiKey,
              basicInstruction: basicInstruction,
              backgroundDetail: backgroundDetail,
              style: style,
            },
            (response) => {
              if (response.status === "error") {
                loading.innerHTML = `<p style="color: var(--primary-color);">生成失败: ${response.message}</p>`;
                progressBarContainer.style.display = "none";
                generateButton.disabled = false;
              }
            }
          );
        });
      } else {
        console.error("Chrome storage sync API not available");
        alert("请先在设置中配置 API Key");
        settingsContent.classList.add("active");
      }
    } catch (error) {
      console.error("Error getting API key:", error);
      alert("获取API Key失败：" + error.message);
    }
  });
});
