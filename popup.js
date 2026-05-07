document.getElementById('extractBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractSlateText,
  });
});

function extractSlateText() {
  const editor = document.querySelector('[data-slate-editor="true"]');
  if (!editor) {
    alert("No editor found on this page.");
    return;
  }

  let fullText = "";
  // Find all block elements (paragraphs/lines)
  const blocks = editor.querySelectorAll('[data-slate-node="element"]');

  blocks.forEach(block => {
    let lineText = "";
    
    // Check for indentation based on your HTML style attribute
    const marginLeft = block.style.marginLeft || "0px";
    const indentLevel = parseInt(marginLeft) / 20; // Slate usually uses 20px or 40px per indent level
    const indentPrefix = "\t".repeat(indentLevel > 0 ? indentLevel : 0);

    // Find all leaf nodes within this block
    const leaves = block.querySelectorAll('[data-slate-leaf="true"]');
    
    leaves.forEach(leaf => {
      let content = leaf.querySelector('[data-slate-string="true"]')?.textContent || "";
      
      // If the leaf contains a <strong> tag, wrap it in Markdown bold
      if (leaf.querySelector('strong') || leaf.tagName === 'STRONG') {
        content = `**${content}**`;
      }
      
      lineText += content;
    });

    // Handle zero-width characters and empty lines
    if (lineText.trim() === "\uFEFF") {
        fullText += "\n";
    } else {
        fullText += indentPrefix + lineText + "\n";
    }
  });

  // Copy to clipboard using a temporary textarea to bypass portal restrictions
  const textArea = document.createElement("textarea");
  textArea.value = fullText;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert("Text copied to clipboard with formatting!");
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
}
