document.getElementById('extractBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 1. Execute the extraction script and get the result back
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractSlateText,
  });

  // 2. Process the returned text
  const extractedText = results[0]?.result;

  if (extractedText) {
    try {
      // 3. Calculate word count
      const words = extractedText.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;

      // 4. Copy to clipboard
      await navigator.clipboard.writeText(extractedText);

      // 5. Success Animation
      statusEl.textContent = `✓ Copied ${wordCount} words!`;
      statusEl.classList.add('show');

      // Hide animation after 2 seconds
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 2000);

    } catch (err) {
      statusEl.textContent = "Error copying text";
      statusEl.classList.add('show');
    }
  }
});

// This function runs inside the webpage
function extractSlateText() {
  const editor = document.querySelector('[data-slate-editor="true"]');
  if (!editor) return null;

  let fullText = "";
  const blocks = editor.querySelectorAll('[data-slate-node="element"]');

  blocks.forEach(block => {
    let lineText = "";
    
    // Indentation logic
    const marginLeft = block.style.marginLeft || "0px";
    const indentLevel = parseInt(marginLeft) / 20; 
    const indentPrefix = "\t".repeat(indentLevel > 0 ? indentLevel : 0);

    const leaves = block.querySelectorAll('[data-slate-leaf="true"]');
    
    leaves.forEach(leaf => {
      let content = leaf.querySelector('[data-slate-string="true"]')?.textContent || "";
      
      // Formatting
      if (leaf.querySelector('strong') || leaf.tagName === 'STRONG') {
        content = `**${content}**`;
      }
      lineText += content;
    });

    if (lineText.trim() === "\uFEFF") {
        fullText += "\n";
    } else {
        fullText += indentPrefix + lineText + "\n";
    }
  });

  return fullText; // Return text to the popup
}
