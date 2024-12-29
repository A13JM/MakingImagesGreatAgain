// Dynamically inject styles (as shown above)
const style = document.createElement('style');
style.textContent = `
    /* [Insert the updated CSS from above here] */
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
const csvUrl = 'https://gist.githubusercontent.com/bem13/0bc5091819f0594c53f0d96972c8b6ff/raw/b0aacd5ea4634ed4a9f320d344cc1fe81a60db5a/danbooru_tags_post_count.csv';

async function loadTags() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        cachedTags = parseCSV(data);

        // **Manually Add '1girl' Tag If Missing**
        if (!cachedTags.includes('1girl')) {
            cachedTags.unshift('1girl'); // Add '1girl' at the beginning of the array
            console.log("'1girl' tag was missing and has been added manually.");
        } else {
            console.log("'1girl' tag is present in the fetched data.");
        }

        filteredTags = cachedTags;
        console.log('Filtered Tags:', filteredTags); // Debugging
        renderVirtualizedList();
    } catch (error) {
        console.error('Error fetching or parsing the CSV data:', error);
        
        // **Fallback: Add '1girl' Manually If Fetch Fails**
        if (!cachedTags.includes('1girl')) {
            cachedTags.unshift('1girl'); // Add '1girl' at the beginning of the array
            console.log("'1girl' tag was added manually after a fetch error.");
            filteredTags = cachedTags;
            renderVirtualizedList();
        }
    }
}

function parseCSV(data) {
    const lines = data.split('\n');
    const tags = lines.slice(1).map(line => line.split(',')[0]?.trim()).filter(Boolean);
    console.log('Parsed Tags:', tags); // Debugging
    return tags;
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
    console.log('Search Input:', searchInput); // Debugging
    console.log('Filtered Tags after search:', filteredTags); // Debugging
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
    void tooltip.offsetWidth; // Trigger reflow to restart transition
    tooltip.classList.add('show');

    // Automatically hide after 2 seconds
    clearTimeout(tooltip.hideTimeout); // Clear any existing timeout
    tooltip.hideTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
    }, 2000); // Hide after 2 seconds
}

window.onload = loadTags;
