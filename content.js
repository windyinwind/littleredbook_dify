(function (data) {
  console.log("Filling content into the editor with data:", data);

  // Fill content when success
  const titleInput = document.querySelector('title-container input[type="text"]');
  if (titleInput) {
    titleInput.value = data.title || "无标题";
    titleInput.dispatchEvent(new Event("input"));
  } else {
    console.error("Title input not found on the page.");
  }

  // 填充正文
  const editorContainer = document.querySelector(".editor-container div[role='textbox']");
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
})(arguments[0]);
