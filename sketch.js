let canvas;
let drawingCanvas;
let isDrawing = false;
let strokeColor;
let backgroundColor;

function setup() {
  // Create canvas that fits its container
  const container = document.getElementById('canvas-container');
  canvas = createCanvas(container.offsetWidth, 300);
  canvas.parent('canvas-container');
  
  // Create an offscreen graphics buffer for drawing
  drawingCanvas = createGraphics(width, height);
  
  // Set drawing styles
  strokeColor = color(0);  // Black
  backgroundColor = color(255);  // White
  
  // Initialize the drawing canvas
  drawingCanvas.background(backgroundColor);
  drawingCanvas.strokeWeight(3);
  drawingCanvas.stroke(strokeColor);
  
  // Set up event handlers
  document.getElementById('clear-btn').addEventListener('click', clearCanvas);
  document.getElementById('recognize-btn').addEventListener('click', recognizeText);
  
  // Display initial state
  updateCanvas();
}

function draw() {
  // Draw the current state of the drawing canvas
  image(drawingCanvas, 0, 0);
  
  // Draw if the mouse is pressed
  if (isDrawing) {
    drawingCanvas.line(pmouseX, pmouseY, mouseX, mouseY);
  }
}

function mousePressed() {
  // Start drawing if the mouse is inside the canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDrawing = true;
    drawingCanvas.line(mouseX, mouseY, mouseX, mouseY); // Draw a point
    return false; // Prevent default behavior
  }
}

function mouseDragged() {
  // Continue drawing if we're in drawing mode
  return false; // Prevent default behavior
}

function mouseReleased() {
  // Stop drawing
  isDrawing = false;
  return false; // Prevent default behavior
}

function touchStarted() {
  // Handle touch input (for mobile devices)
  if (touches.length > 0 && 
      touches[0].x >= 0 && touches[0].x <= width && 
      touches[0].y >= 0 && touches[0].y <= height) {
    isDrawing = true;
    drawingCanvas.line(touches[0].x, touches[0].y, touches[0].x, touches[0].y); // Draw a point
    return false; // Prevent default behavior
  }
}

function touchMoved() {
  // Continue drawing with touch
  if (isDrawing && touches.length > 0) {
    drawingCanvas.line(ptouches[0].x, ptouches[0].y, touches[0].x, touches[0].y);
  }
  return false; // Prevent default behavior
}

function touchEnded() {
  // Stop drawing
  isDrawing = false;
  return false; // Prevent default behavior
}

function clearCanvas() {
  // Clear the drawing canvas
  drawingCanvas.background(backgroundColor);
  updateCanvas();
  
  // Also clear the result area
  document.getElementById('result-text').innerText = '';
  updateConfidence(0);
}

function updateCanvas() {
  // Update the displayed canvas with the current drawing
  image(drawingCanvas, 0, 0);
}

async function recognizeText() {
  // Show loading indicator
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('result-text').innerText = '';
  
  try {
    // Get the canvas data as base64 image
    const imageData = canvas.elt.toDataURL('image/png');
    
    // Send to server for OCR processing
    const response = await fetch('/api/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });
    
    if (!response.ok) {
      throw new Error('Server returned an error');
    }
    
    const result = await response.json();
    
    // Display the recognized text
    document.getElementById('result-text').innerText = result.text || 'No text recognized';
    
    // Update confidence meter
    updateConfidence(result.confidence);
    
  } catch (error) {
    console.error('Error recognizing text:', error);
    document.getElementById('result-text').innerText = 'Error: Failed to process handwriting';
    updateConfidence(0);
  } finally {
    // Hide loading indicator
    document.getElementById('loading').classList.add('hidden');
  }
}

function updateConfidence(confidence) {
  // Update the confidence meter
  const percentage = Math.round(confidence * 100);
  document.getElementById('confidence-bar').style.width = `${percentage}%`;
  document.getElementById('confidence-value').innerText = `${percentage}%`;
  
  // Change color based on confidence level
  const bar = document.getElementById('confidence-bar');
  if (percentage < 30) {
    bar.style.backgroundColor = '#e74c3c'; // Red
  } else if (percentage < 70) {
    bar.style.backgroundColor = '#f39c12'; // Orange
  } else {
    bar.style.backgroundColor = '#2ecc71'; // Green
  }
}

// Handle window resize
function windowResized() {
  // Resize the canvas to match its container
  const container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, 300);
  
  // Create a new drawing canvas with the new dimensions
  const newDrawingCanvas = createGraphics(width, height);
  newDrawingCanvas.background(backgroundColor);
  newDrawingCanvas.image(drawingCanvas, 0, 0, width, height);
  newDrawingCanvas.strokeWeight(3);
  newDrawingCanvas.stroke(strokeColor);
  
  // Replace the old drawing canvas
  drawingCanvas = newDrawingCanvas;
  updateCanvas();
}
