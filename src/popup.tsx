import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import "./global.css";

type AnalysisItem = {
  title: string;
  explanation: string;
  suggestion?: string;
  severity: string;
}

type AnalysisResults = {
  overallAssessment: string;
  detailedAnalysis: AnalysisItem[];
  summary: string;
}

const Popup: React.FC = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "displayResults") {
        setResults(request.results);
      }
    });
  }, []);

  const handleExport = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "exportResults" });
      }
    });
  };

  if (!results) {
    return (
      <div id="app">
        <h1>Legal Text Analyzer</h1>
        <p>Right-click on selected text and choose "Analyze Policy" to start analysis.</p>
      </div>
    );
  }

  return (
    <div id="app" className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Legal Text Analyzer</h1>
      <div id="result" className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
        <h3 className="text-lg font-medium mb-1">Overall Assessment</h3>
        <p className="mb-4">{results.overallAssessment}</p>
        <h3 className="text-lg font-medium mb-1">Detailed Analysis</h3>
        {results.detailedAnalysis.map((item, index) => (
          <div key={index} className={`analysis-item mb-4 p-3 rounded-lg ${item.severity === 'high' ? 'bg-red-100' : item.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
            <h4 className="font-semibold">{item.title}</h4>
            <p>{item.explanation}</p>
            {item.suggestion && <p><strong>Suggestion:</strong> {item.suggestion}</p>}
          </div>
        ))}
        <h3 className="text-lg font-medium mb-1">Summary</h3>
        <p className="mb-4">{results.summary}</p>
      </div>
      <button id="exportBtn" onClick={handleExport} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Export Results</button>
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('root'));
