const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'app);

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/save.html'));
});

// Save endpoint
app.post('/save', (req, res) => {
    const { bool, text, uri } = req.body;
    if (bool && text && uri) {
        const filePath = path.join(__dirname, 'savedTexts', `${Date.now()}.txt`);
        fs.writeFile(filePath, text, (err) => {
            if (err) {
                return res.status(500).send('Error saving the text');
            }
            res.status(200).send('Text saved successfully');
        });
    } else {
        res.status(400).send('Invalid data');
    }
});

// Raw text endpoint
app.get('/raw', (req, res) => {
    res.sendFile(path.join(__dirname, 'rawText.html')); // Adjust this path based on your structure
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
