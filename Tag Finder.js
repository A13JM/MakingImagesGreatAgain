let lastValidMessage = "Input Ratio:"; // Default message when no valid resolution is output
let demoInterval; // To track the interval for the demo animation

function calculateResolution(aspectRatio) {
    const totalPixels = 1048576; // Total pixels (1024 x 1024)
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

    // Validate aspect ratio
    if (!widthRatio || !heightRatio || widthRatio <= 0 || heightRatio <= 0) {
        return null; // Return null for invalid inputs
    }

    // Calculate scale factor and dimensions
    const scaleFactor = Math.sqrt(totalPixels / (widthRatio * heightRatio));
    const width = Math.round(widthRatio * scaleFactor);
    const height = Math.round(heightRatio * scaleFactor);

    // Update the preview box with calculated dimensions
    updatePreviewBox(width, height);

    return `${width} x ${height}`; // Return formatted resolution
}

function validateAndCalculate() {
    const aspectRatioInput = document.getElementById('aspectRatio').value.trim();
    const outputElement = document.getElementById('output');

    // Stop demo animation when user starts typing
    clearInterval(demoInterval);

    // Check if input contains valid separator ':'
    if (aspectRatioInput.includes(':')) {
        const result = calculateResolution(aspectRatioInput);

        if (result) {
            // Valid resolution: Update the message
            lastValidMessage = `Resolution: ${result}`;
        }
    }

    // Display the last valid message or default if none exists
    displayOutput(outputElement, lastValidMessage);
}

function displayOutput(element, message) {
    element.textContent = message;

    // Change color dynamically based on the message
    if (message === "Input Ratio:") {
        element.style.color = "#373737"; // Keep gray for default message
    } else {
        element.style.color = "#80c7ff"; // Replace this with the original or desired color
    }

    element.classList.add('show');
}

function updatePreviewBox(width, height) {
    const previewBox = document.getElementById('previewBox');
    const maxDimension = 200; // Maximum size for the preview box
    const scaleFactor = Math.min(maxDimension / width, maxDimension / height);

    // Update the preview box dimensions
    previewBox.style.width = `${Math.round(width * scaleFactor)}px`;
    previewBox.style.height = `${Math.round(height * scaleFactor)}px`;
}

function startDemoAnimation() {
    const previewBox = document.getElementById('previewBox');

    demoInterval = setInterval(() => {
        const randomWidth = Math.floor(Math.random() * 300) + 50; // Random width between 50 and 300
        const randomHeight = Math.floor(Math.random() * 300) + 50; // Random height between 50 and 300

        // Apply random dimensions to the preview box
        previewBox.style.width = `${randomWidth}px`;
        previewBox.style.height = `${randomHeight}px`;
    }, 500); // Change dimensions every 300ms for smoother transitions

    // Stop the demo after 5 seconds
    setTimeout(() => {
        clearInterval(demoInterval);
        previewBox.style.width = "150px"; // Reset to default size
        previewBox.style.height = "150px";
    }, 2000);
}

// Start demo animation on page load
window.onload = () => {
    startDemoAnimation();

    // Initialize default output
    const outputElement = document.getElementById('output');
    displayOutput(outputElement, lastValidMessage);
};

// Add an input event listener to validate and calculate dynamically
document.getElementById('aspectRatio').addEventListener('input', validateAndCalculate);
