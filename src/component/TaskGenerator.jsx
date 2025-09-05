// TaskGenerator.jsx
import React, { useEffect, useState } from "react";
import { Groq } from "groq-sdk";
import "../assets/taskgenerator.css";
import "../App.css";

const TaskGenerator = () => {
  /* ---------- UI state ---------- */
  const [category, setCategory] = useState("work");
  const [complexity, setComplexity] = useState("medium");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");

  /* ---------- Groq API ---------- */
  const generateTask = async () => {
    if (!apiKey) {
      setError("Please enter your Groq API key");
      return;
    }

    setLoading(true);
    setError("");
    setTasks([]);

    try {
      /* 1️⃣ Build the prompt (unchanged) */
      const prompt = `
      You are a task generator.

Rules:
- Respond ONLY with a JSON array.
- Do not include any explanations, text, or formatting outside JSON. or any ending statement.
- The JSON must be valid and directly parsable.

Example format:
[
  { "title": "Crazy Painter", "description": "Paint a masterpiece using only your feet." },
  { "title": "Time Traveler", "description": "Travel back in time and meet your ancestors." }
]

Now Generate 5 completely random, casual, and even useless tasks. 
Make them feel unexpected, funny, or just for timepass/testing and sometime very important, serious, and life related. 
      `;

     const topics = [
  "daily life", "weekend fun", "office work", "family time", "school days", 
  "fitness", "food", "friends", "gaming", "travel", 
  "music", "shopping", "pets", "technology", "nature","aliens", "cats", "office life", "dreams", "memes", "time travel", "robots", "ghosts", "school days", "superheroes"
];

const actions = [
  "generate", "list", "come up with", "suggest", "make a list of", "create",
  "invent", "list", "create", "imagine", "design", "describe"
];

const vibes = [
  "funny", "random", "unexpected", "casual", "weird but doable", 
  "timepass", "light-hearted", "pointless", "creative",
  "funny", "weird", "useless", "pointless", "random", "chaotic", "silly"
];

const outputs = [
  "tasks", "to-dos", "things to try", "activities", "mini challenges", "errands",
   "hobbies", "jobs", "rituals", "missions", "life tips"
];

// Helper: pick random from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a random task prompt
function generatePrompt() {
  return `${pick(actions)} 5 ${pick(vibes)} ${pick(outputs)} related to ${pick(topics)}.`;
}

// pick random one each time
const randomPrompt = generatePrompt()

      /* 2️⃣ Create a Groq client instance */
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

      /* 3️⃣ Make the chat‑completion request */
      const response = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: 
      `You are a task generator.

Rules:
- Respond ONLY with a JSON array.
- Do not include any explanations, text, or formatting outside JSON.
- The JSON must be valid and directly parsable.

Example format:
[
  { "title": "Crazy Painter", "description": "Paint a masterpiece using only your feet." },
  { "title": "Time Traveler", "description": "Travel back in time and meet your ancestors." }
]` },
    { role: "user", content: randomPrompt }
  ],
  temperature: 0.9,
  top_p: 0.95,
  frequency_penalty: 0.6,
  max_completion_tokens: 200,
  presence_penalty: 0.6
});

      
      /* 4️⃣ Extract the generated text */
      const generatedContent = response.choices[0]?.message?.content ?? "";
      console.log(generatedContent);
      
      /* 5️⃣ Try to parse the JSON response */
      try {
        const taskData = JSON.parse(generatedContent);
        
        
        if (Array.isArray(taskData)) {
          setTasks(taskData); // store the whole array
        } else {
          setTasks([taskData]); // fallback – wrap single object into array
        }
        
      } catch (parseErr) {
        // fallback regex-based extraction
        const titleMatch = generatedContent.match(/"title":\s*"([^"]+)"/);
        const descMatch = generatedContent.match(/"description":\s*"([^"]+)"/);

        if (titleMatch && descMatch) {
          setTasks([{ title: titleMatch[1], description: descMatch[1] }]);
        } else {
          // Very last resort: split by lines
          const lines = generatedContent.split("\n").filter(Boolean);
          setTasks([
            {
              title: lines[0] || "Generated Task",
              description: lines.slice(1).join(" ") || "No description generated",
            },
          ]);
        }
      }
    } catch (err) {
      /* 6️⃣ Error handling */
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to generate task. Check your API key.";
      setError(msg);
      console.error("Error generating task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log(taskData);
    console.log(tasks);
  }, [tasks])
  /* ---------- UI ---------- */
  return (
    <div className="task-generator">
      <h1>AI Task Generator</h1>
      <p className="subtitle">Direct API integration with Groq</p>

      <div className="api-key-section">
        <label htmlFor="api-key">Groq API Key:</label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Groq API key"
        />
        <p className="key-note">Your API key is stored only in your browser memory</p>
      </div>

      <div className="controls">
        {/* Category selector */}
        <div className="input-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health & Fitness</option>
            <option value="learning">Learning</option>
            <option value="creative">Creative</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Complexity selector */}
        <div className="input-group">
          <label htmlFor="complexity">Complexity:</label>
          <select
            id="complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
          >
            <option value="simple">Simple</option>
            <option value="medium">Medium</option>
            <option value="complex">Complex</option>
          </select>
        </div>

        <button
          onClick={generateTask}
          disabled={loading || !apiKey}
          className="generate-btn"
        >
          {loading ? "Generating…" : "Generate Task"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {tasks.length > 0 && (
  <div className="task-result">
    <h2>Suggested Tasks</h2>
    <ul>
      {tasks.map((t, index) => (
        <li key={index}>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </li>
      ))}
    </ul>
  </div>
)}

      <div className="info-box">
        <h3>How This Works</h3>
        <p>This React app calls the Groq API directly from the browser.</p>
        <p>
          You need to provide your own Groq API key, which you can get from{" "}
          <a
            href="https://console.groq.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Groq’s console
          </a>
          .
        </p>
        <p>Your API key is never sent to any server except Groq.</p>
      </div>
    </div>
  );
};

export default TaskGenerator;