const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // Import mongoose
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const map = new Map();

// MongoDB connection string
const mongoURI = "mongodb+srv://romeobot555:mdraselm325@cluster0.ue47qhn.mongodb.net/pastebin?retryWrites=true&w=majority"; // Replace with your actual MongoDB URI

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define a simple schema and model if needed
const DataSchema = new mongoose.Schema({
  uri: { type: String, required: true, unique: true },
  text: { type: String, required: true }
});

const DataModel = mongoose.model("Data", DataSchema);

app.get("/save/:params*", async (req, res) => {
  try {
    let endpoint = req.params.params;

    if (!endpoint) {
      const generateRandomString = () => [...Array(8 + Math.floor(Math.random() * 3))].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      return res.redirect(`/save/${generateRandomString()}`);
    }

    endpoint = `/${endpoint}`;

    // Check if data exists in the map or MongoDB
    if (map.has(endpoint)) {
      const data = fs.readFileSync("app/save.html", 'utf-8');
      const textData = map.get(endpoint);
      const HTML = generateHTML(textData); // Create HTML with textData
      return res.contentType('text/html').send(HTML);
    } else {
      const dbData = await DataModel.findOne({ uri: endpoint }).exec();
      if (dbData) {
        const data = fs.readFileSync("app/save.html", 'utf-8');
        const HTML = generateHTML(dbData.text); // Create HTML with text from DB
        return res.contentType('text/html').send(HTML);
      }
      return res.send(fs.readFileSync("app/save.html", 'utf-8'));
    }
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post("/save", async (req, res) => {
  try {
    let { bool, text, uri } = req.body;
    if (!bool || !text || !uri) return res.status(400).end();

    const formattedUri = uri.replace(/^\/save\//, "/");
    text = text.replace("\n", "\n");
    map.set(formattedUri, text);

    // Save to MongoDB
    const data = new DataModel({ uri: formattedUri, text });
    await data.save();

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.get("/raw/:params*", async (req, res) => {
  try {
    const endpoint = req.params['0'];
    const data = map.get(endpoint) || (await DataModel.findOne({ uri: endpoint }).exec());

    if (!data) return res.status(404).end("Data not found");

    res.setHeader("Content-Type", "text/plain;charset=utf-8");
    res.send(data.text);
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.get("/save", (req, res) => {
  const generateRandomString = () => [...Array(8 + Math.floor(Math.random() * 3))].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  return res.redirect(`/save/${generateRandomString()}`);
});

app.use((req, res, next) => {
  if (req.method === 'GET' && req.path !== '/save' && req.path !== '/raw') {
    res.redirect('/save');
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log("Running on Port " + PORT);
});

// Helper function to generate HTML
function generateHTML(textData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Share Text/Code</title>
  <meta name="description" content="A platform for sharing code or text with dynamic real-time updates">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f0f8ff; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
    #container { height: 93vh; width: 85vw; max-width: 920px; padding: 20px; box-sizing: border-box; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); position: relative; }
    textarea { width: calc(100% - 0px); height: 98%; margin: 10px 0; box-sizing: border-box; border: 2px solid #87CEEB; border-radius: 10px; padding: 15px; padding-top: 20px; font-family: inherit; resize: none; outline: none; }
    #copyButton, #rawButton { position: absolute; top: 10px; cursor: pointer; padding: 10px; border-radius: 5px; color: #ffffff; }
    #copyButton { left: 10px; background-color: #87CEEB; }
    #rawButton { right: 10px; background-color: #87CEEB; }
  </style>
</head>
<body>
  <div id="container">
    <button id="copyButton" onclick="copyToClipboard()">Copy</button>
    <button id="rawButton" onclick="redirectToRaw()">Raw</button>
    <textarea id="text" onclick="disableZoom(event)">${textData}</textarea>
  </div>
  <script>
    function disableZoom(event) { event.preventDefault(); }
    const textarea = document.getElementById('text');
    textarea.addEventListener('input', (event) => { if (!event.target.value.length || event.target.value.length == 0) return; const data = { bool: true, text: event.target.value, uri: window.location.pathname }; fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(data), }); });
    function redirectToRaw() { window.location.href = '/raw' + window.location.pathname; }
    function copyToClipboard() { const textArea = document.getElementById('text'); textArea.select(); document.execCommand('copy'); console.log("Copied"); }
  </script>
</body>
</html>`;
}