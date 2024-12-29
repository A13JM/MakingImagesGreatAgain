// Tag Finder.js

// Dynamically inject additional styles specific to the Tag Finder
const style = document.createElement('style');
style.textContent = `
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 400px; /* Increased max-width for better layout */
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .search-bar {
        width: 100%;
        margin-bottom: 20px;
    }
    .search-bar input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.3s;
    }
    .search-bar input:focus {
        border-color: #3498db;
        outline: none;
    }
    .scrolling-frame {
        width: 100%;
        height: 450px;
        border: 1px solid #ddd;
        border-radius: 6px;
        overflow-y: auto;
        background-color: #fafafa;
        position: relative;
    }
    .scrolling-frame::-webkit-scrollbar {
        width: 8px;
    }
    .scrolling-frame::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    .scrolling-frame::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }
    .scrolling-frame::-webkit-scrollbar-thumb:hover {
        background: #bbb;
    }
    .virtual-list {
        position: relative;
        width: 100%;
    }
    .virtual-item {
        position: absolute;
        width: 95%;
        left: 2.5%;
        padding: 10px 12px;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 4px;
        margin-bottom: 10px;
        color: #333;
        transition: background 0.3s, transform 0.2s;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .virtual-item:hover {
        background: #f0f8ff;
        transform: scale(1.02);
    }
    .virtual-item span.highlight {
        background-color: #ffeb3b;
        color: #333;
        border-radius: 3px;
    }
    /* Tooltip styles */
    .tooltip {
        position: fixed;
        background-color: #333;
        color: #fff;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
        z-index: 1000;
        left: 50%;
        bottom: 40px;
    }
    .tooltip.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        animation: flyIn 0.3s ease forwards;
    }
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

// Create the HTML structure within the #app container
const app = document.getElementById('app');
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
app.appendChild(container);

// Create a tooltip element for copy confirmation
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
tooltip.id = 'tooltip';
tooltip.innerText = 'Copied!';
document.body.appendChild(tooltip);

// JavaScript logic for functionality
let cachedTags = [];
let filteredTags = [];
const itemHeight = 60; // Adjusted for larger items
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
    tooltip.style.backgroundColor = isError ? '#e74c3c' : '#333';

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
