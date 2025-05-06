const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { createCanvas } = require('canvas');
const tesseract = require('node-tesseract-ocr');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// OCR configuration
const config = {
  lang: 'eng',
  oem: 1,
  psm: 6,
}

// API endpoint for processing handwriting
app.post('/api/recognize', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Remove the data:image/png;base64 part if present
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    
    // Create a temporary file to save the image
    const tempFilePath = path.join(__dirname, 'temp_handwriting.png');
    fs.writeFileSync(tempFilePath, base64Data, 'base64');
    
    // Process the image with Tesseract OCR
    const text = await tesseract.recognize(tempFilePath, config);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Return the recognized text
    res.json({ 
      text: text.trim(),
      confidence: calculateConfidence(text)
    });
    
  } catch (error) {
    console.error('Error recognizing handwriting:', error);
    res.status(500).json({ error: 'Failed to process handwriting', details: error.message });
  }
});

// Calculate a confidence score based on text length and content
function calculateConfidence(text) {
  if (!text || text.trim().length === 0) return 0;
  
  // Simple heuristic for confidence - can be improved
  let score = 0.5; // Base score
  
  // Longer recognized text generally means higher confidence
  score += Math.min(text.length / 100, 0.3);
  
  // Number of non-alphanumeric characters reduces confidence
  const nonAlphaNumeric = text.replace(/[a-zA-Z0-9\s]/g, '').length;
  score -= Math.min(nonAlphaNumeric / text.length, 0.4);
  
  return Math.max(0, Math.min(score, 1)); // Clamp between 0 and 1
}

// Start the server
app.listen(PORT, () => {
  console.log(`Handwriting recognition server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
