let selectedText: string = '';

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  selectedText = selection ? selection.toString().trim() : '';
});

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === "getSelectedText") {
    sendResponse({text: selectedText});
  } else if (request.action === "exportResults") {
    exportResults();
  }
});

function exportResults(): void {
  chrome.storage.local.get(['analysisResults'], (result: { analysisResults?: any }) => {
    if (result.analysisResults) {
      const blob = new Blob([JSON.stringify(result.analysisResults, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal_analysis_results.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });
}

console.log("Content script loaded");
