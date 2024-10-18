console.log("Hello from Background!");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzePolicy",
    title: "Analyze Policy",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzePolicy" && tab && tab.id) {
    // Check if the tab is still available
    chrome.tabs.get(tab.id, (currentTab) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (res) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            return;
          }
          if (res && res.text) analyzeText(res.text);
        });
      } else console.error("Tab ID is undefined");
    });
  }
});

interface AnalysisResult {
  overallAssessment: string;
  detailedAnalysis: Array<{ title: string; content: string }>;
  summary: string;
}

async function analyzeText(text: string): Promise<void> {
  try {
    const apiKey = await getApiKey();

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the following legal text and provide:
                  1. An overall assessment of the policy's fairness and transparency
                  2. Identification of potentially problematic clauses or sections
                  3. Explanations for why certain parts are considered concerning
                  4. Suggestions for improvements or areas that require further clarification
                  5. A brief summary of the analysis findings

                  Legal text:${text}`
          }]
        }]
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const analysis = parseAnalysis(data);

    chrome.storage.local.set({ analysisResults: analysis });
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "displayResults", results: analysis }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error sending results:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "displayResults",
          results: {
            overallAssessment: "An error occurred during analysis.",
            detailedAnalysis: [],
            summary: "Please try again later."
          }
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error sending error message:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
}

function parseAnalysis(data: any): AnalysisResult {
  if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
    throw new Error('Invalid response format');
  }

  const content = data.candidates[0].content.parts[0].text;
  const sections = content.split(/\d+\.\s+/).filter(Boolean);

  return {
    overallAssessment: sections[0].trim(),
    detailedAnalysis: [
      { title: "Potentially Problematic Clauses", content: sections[1].trim() },
      { title: "Explanations", content: sections[2].trim() },
      { title: "Suggestions for Improvement", content: sections[3].trim() }
    ],
    summary: sections[4].trim()
  };
}

async function getApiKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        resolve(result.geminiApiKey);
      } else {
        reject(new Error('API key not found. Please set it in the extension options.'));
      }
    });
  });
}
