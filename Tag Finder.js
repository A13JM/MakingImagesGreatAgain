// Dynamically inject styles
const style = document.createElement('style');
style.textContent = `
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #121212; /* Dark background */
        color: #e0e0e0; /* Light text color for contrast */
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 320px;
    }
    .search-bar {
        width: 100%;
        margin-bottom: 15px;
    }
    .search-bar input {
        width: 100%;
        padding: 10px;
        border: 1px solid #333;
        border-radius: 5px;
        background-color: #1e1e1e;
        color: #e0e0e0;
        box-sizing: border-box;
    }
    .scrolling-frame {
        width: 100%;
        height: 400px;
        border: 1px solid #333;
        border-radius: 5px;
        overflow-y: auto;
        background-color: #1e1e1e;
        box-sizing: border-box;
        position: relative;
    }
    .scrolling-frame::-webkit-scrollbar {
        width: 8px; /* Shrink the scrollbar size */
    }
    .scrolling-frame::-webkit-scrollbar-track {
        background: #1e1e1e; /* Dark scrollbar track */
    }
    .scrolling-frame::-webkit-scrollbar-thumb {
        background: #444; /* Darker scrollbar handle */
        border-radius: 4px;
    }
    .scrolling-frame::-webkit-scrollbar-thumb:hover {
        background: #555; /* Slightly lighter on hover */
    }
    .virtual-list {
        position: relative;
        width: 100%;
    }
    .virtual-item {
        position: absolute;
        width: 95%; /* Slightly shrink the lighter gray width */
        left: 2.5%; /* Center align */
        padding: 8px; /* Reduced padding */
        box-sizing: border-box;
        background: #333;
        border-radius: 3px;
        margin-bottom: 8px;
        color: #e0e0e0;
        transition: background 0.3s, transform 0.2s;
        cursor: pointer; /* Indicate clickable items */
    }
    .virtual-item:hover {
        background: #444;
        transform: scale(1.02); /* Slightly enlarge on hover */
    }
    .virtual-item span.highlight {
        background-color: #444;
        color: #ffcc00; /* Highlighted text color */
        border-radius: 3px;
    }
    /* Tooltip styles */
    .tooltip {
        position: fixed; /* Changed to fixed to position relative to viewport */
        background-color: #444;
        color: #fff;
        padding: 10px 20px; /* Increased padding for larger size */
        border-radius: 6px; /* Slightly larger border-radius */
        font-size: 14px; /* Increased font size */
        opacity: 0;
        transform: translateY(20px); /* Start below */
        transition: opacity 0.3s ease, transform 0.3s ease; /* Consistent transition */
        pointer-events: none;
        z-index: 1000;
        left: 50%;
        bottom: 30px; /* Positioned 30px from the bottom */
        transform: translateX(-50%) translateY(20px); /* Center horizontally and start below */
    }
    .tooltip.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0); /* Move to final position */
        animation: flyIn 0.3s ease forwards; /* Fly-in animation */
    }
    /* Fly-in keyframes */
    @keyframes flyIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Create the HTML structure
const container = document.createElement('div');
container.className = 'container';

const searchBar = document.createElement('div');
searchBar.className = 'search-bar';
const input = document.createElement('input');
input.type = 'text';
input.id = 'searchInput';
input.placeholder = 'Search tags...';
input.oninput = () => filterAndRender();
searchBar.appendChild(input);

const scrollingFrame = document.createElement('div');
scrollingFrame.className = 'scrolling-frame';
scrollingFrame.id = 'scrollingFrame';

const virtualList = document.createElement('div');
virtualList.className = 'virtual-list';
virtualList.id = 'virtualList';

scrollingFrame.appendChild(virtualList);
container.appendChild(searchBar);
container.appendChild(scrollingFrame);
document.body.appendChild(container);

// Create a tooltip element for copy confirmation
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
tooltip.id = 'tooltip';
tooltip.innerText = 'Copied!';
document.body.appendChild(tooltip);

// JavaScript logic for functionality
let cachedTags = [];
let filteredTags = [];
const itemHeight = 50;
const buffer = 5;

// URL of the raw CSV file on GitHub
const csvUrl = 'https://raw.githubusercontent.com/BetaDoggo/danbooru-tag-list/main/danbooru-12-10-24-dash.csv';

async function loadTags() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        cachedTags = parseCSV(data);
        filteredTags = cachedTags;
        renderVirtualizedList();
    } catch (error) {
        console.error('Error fetching or parsing the CSV data:', error);
    }
}

function parseCSV(data) {
    const lines = data.split('\n');
    return lines.slice(1).map(line => line.split(',')[0]?.trim()).filter(Boolean);
}

function renderVirtualizedList() {
    const scrollingFrame = document.getElementById('scrollingFrame');
    const virtualList = document.getElementById('virtualList');

    virtualList.style.height = `${filteredTags.length * itemHeight}px`;

    // Remove previous scroll listener to prevent multiple bindings
    scrollingFrame.removeEventListener('scroll', onScroll);
    scrollingFrame.addEventListener('scroll', onScroll);
    updateVisibleItems(scrollingFrame, virtualList);
}

function onScroll(event) {
    const scrollingFrame = event.target;
    const virtualList = document.getElementById('virtualList');
    updateVisibleItems(scrollingFrame, virtualList);
}

function updateVisibleItems(scrollingFrame, virtualList) {
    const scrollTop = scrollingFrame.scrollTop;
    const frameHeight = scrollingFrame.clientHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
        filteredTags.length,
        Math.ceil((scrollTop + frameHeight) / itemHeight) + buffer
    );

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
        const item = document.createElement('div');
        item.className = 'virtual-item';
        item.style.top = `${i * itemHeight}px`;
        item.innerHTML = highlightText(filteredTags[i], document.getElementById('searchInput').value);
        item.dataset.tag = filteredTags[i]; // Store the tag for copying

        // Add click event listener to copy tag
        item.addEventListener('click', () => copyToClipboard(filteredTags[i]));

        fragment.appendChild(item);
    }

    virtualList.innerHTML = '';
    virtualList.appendChild(fragment);
}

function highlightText(tag, query) {
    if (!query) return tag;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return tag.replace(regex, `<span class="highlight">$1</span>`);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters for regex
}

function filterAndRender() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    filteredTags = cachedTags.filter(tag => tag.toLowerCase().includes(searchInput));
    renderVirtualizedList();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showTooltip(`Copied "${text}" to clipboard`);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showTooltip('Failed to copy', true);
    }
}

function showTooltip(message, isError = false) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerText = message;
    tooltip.style.backgroundColor = isError ? '#ff4c4c' : '#444';
    
    // Reset animation by removing and re-adding the 'show' class
    tooltip.classList.remove('show');
    void tooltip.offsetWidth; // Trigger reflow to restart animation
    tooltip.classList.add('show');

    // Automatically hide after 2 seconds
    clearTimeout(tooltip.hideTimeout); // Clear any existing timeout
    tooltip.hideTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
    }, 2000); // Hide after 2 seconds
}

window.onload = loadTags;
