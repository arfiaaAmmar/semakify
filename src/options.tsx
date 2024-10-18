import { useState, useEffect, FC, FormEvent, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";

const Options: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        setApiKey(result.geminiApiKey);
      }
    });
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      setStatus('API key saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    });
  };

  return (
    <div className="w-screen h-screen flex justify-center p-12">
      <div className="w-full max-w-4xl flex flex-col gap-y-8">
        <h1 className="text-4xl font-semibold border-b border-black pb-2">
          Legal Text Analyzer Settings
        </h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="apiKey">Gemini AI API Key:</label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
          <button type="submit">Save</button>
        </form>
        {status && <p>{status}</p>}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Options />
  </StrictMode>
);
