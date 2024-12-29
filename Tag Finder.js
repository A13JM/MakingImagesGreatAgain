// Tag Finder.js

// Dynamically inject additional styles specific to the Tag Finder
const style = document.createElement('style');
style.textContent = `
    /* Additional styles can be placed here if needed */
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
input.setAttribute('aria-label', 'Search tags'); // Accessibility
input.oninput = debounce(() => filterAndRender(), 300); // Debounced input
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
tooltip.setAttribute('role', 'status');
tooltip.setAttribute('aria-live', 'polite');
document.body.appendChild(tooltip);

// JavaScript logic for functionality
let cachedTags = [];
let filteredTags = [];
const itemHeight = 70; // Adjusted for larger items
const buffer = 5;

// URL of the raw CSV file on GitHub
const csvUrl = 'https://raw.githubusercontent.com/BetaDoggo/danbooru-tag-list/main/danbooru-12-10-24-dash.csv';

async function loadTags() {
    // Show loading indicator
    const loadingIndicator = document.createElement('p');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.innerText = 'Loading tags...';
    container.appendChild(loadingIndicator);

    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        cachedTags = parseCSV(data);
        filteredTags = cachedTags;
        renderVirtualizedList();
    } catch (error) {
        console.error('Error fetching or parsing the CSV data:', error);
        loadingIndicator.innerText = 'Failed to load tags. Please try again later.';
    } finally {
        loadingIndicator.style.display = 'none';
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

    // Clear existing items
    virtualList.innerHTML = '';

    if (filteredTags.length === 0) {
        virtualList.innerHTML = '<p class="no-results">No tags found.</p>';
        return;
    }

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

// Debounce function to limit the rate of function calls
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
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
