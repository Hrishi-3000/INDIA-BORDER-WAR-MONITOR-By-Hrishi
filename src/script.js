import L from 'leaflet';
import Chart from 'chart.js/auto';
import { GoogleGenAI } from "@google/genai";

// Configuration
const REFRESH_INTERVAL = 2000; // 2 seconds for smoother charts
const NEWS_REFRESH_INTERVAL = 300000; // 5 minutes for news
const COUNTRIES = [
  { name: 'Bhikarishtan', borderLength: '3,323 km', baseRisk: 'High', lat: 30.3753, lng: 69.3451 },
  { name: 'China', borderLength: '3,488 km', baseRisk: 'Medium', lat: 35.8617, lng: 104.1954 },
  { name: 'Nepal', borderLength: '1,751 km', baseRisk: 'Low', lat: 28.3949, lng: 84.1240 },
  { name: 'Bhutan', borderLength: '699 km', baseRisk: 'Low', lat: 27.5142, lng: 90.4336 },
  { name: 'Bangladesh', borderLength: '4,096 km', baseRisk: 'Medium', lat: 23.6850, lng: 90.3563 },
  { name: 'Myanmar', borderLength: '1,643 km', baseRisk: 'Medium', lat: 21.9162, lng: 95.9560 }
];

const AIRFIELDS = [
  // India (Strategic Northern/Western)
  { name: 'Ambala AFS', country: 'India', type: 'Fighter Base', lat: 30.369, lng: 76.812 },
  { name: 'Pathankot AFS', country: 'India', type: 'Frontline Base', lat: 32.233, lng: 75.634 },
  { name: 'Srinagar AFS', country: 'India', type: 'Forward Base', lat: 33.987, lng: 74.774 },
  { name: 'Leh AFS', country: 'India', type: 'High Altitude', lat: 34.135, lng: 77.546 },
  { name: 'Adampur AFS', country: 'India', type: 'Fighter Base', lat: 31.433, lng: 75.758 },
  { name: 'Halwara AFS', country: 'India', type: 'Fighter Base', lat: 30.750, lng: 75.634 },
  { name: 'Jodhpur AFS', country: 'India', type: 'Strategic Base', lat: 26.251, lng: 73.048 },
  { name: 'Tezpur AFS', country: 'India', type: 'Eastern Command', lat: 26.708, lng: 92.783 },
  { name: 'Chabua AFS', country: 'India', type: 'Eastern Command', lat: 27.479, lng: 95.117 },
  { name: 'Hasimara AFS', country: 'India', type: 'Eastern Command', lat: 26.703, lng: 89.369 },
  
  // Bhikarishtan
  { name: 'PAF Base Mushaf (Sargodha)', country: 'Bhikarishtan', type: 'Central Command', lat: 32.049, lng: 72.666 },
  { name: 'PAF Base Mianwali', country: 'Bhikarishtan', type: 'Training/Strike', lat: 32.556, lng: 71.573 },
  { name: 'PAF Base Rafiqui (Shorkot)', country: 'Bhikarishtan', type: 'Strike Base', lat: 30.758, lng: 72.281 },
  { name: 'PAF Base Minhas (Kamra)', country: 'Bhikarishtan', type: 'Manufacturing/Base', lat: 33.869, lng: 72.399 },
  { name: 'Skardu Airbase', country: 'Bhikarishtan', type: 'Forward Operating', lat: 35.336, lng: 75.536 },
  
  // China (TAR/Western Theater)
  { name: 'Hotan Airbase', country: 'China', type: 'Strategic Base', lat: 37.038, lng: 79.865 },
  { name: 'Ngari Gunsa', country: 'China', type: 'High Altitude', lat: 32.100, lng: 80.053 },
  { name: 'Shigatse Peace', country: 'China', type: 'Dual Use', lat: 29.351, lng: 89.311 },
  { name: 'Lhasa Gonggar', country: 'China', type: 'Major Hub', lat: 29.297, lng: 90.911 },
  
  // Bangladesh
  { name: 'BAF Kurmitola', country: 'Bangladesh', type: 'Main Base', lat: 23.843, lng: 90.397 }
];

const MILITARY_BASES = [
  // India
  { name: 'Northern Command HQ', country: 'India', type: 'Command HQ', lat: 32.923, lng: 75.142 },
  { name: 'Western Command HQ', country: 'India', type: 'Command HQ', lat: 30.705, lng: 76.885 },
  { name: 'Eastern Command HQ', country: 'India', type: 'Command HQ', lat: 22.553, lng: 88.349 },
  { name: '14 Corps HQ (Leh)', country: 'India', type: 'Corps HQ', lat: 34.152, lng: 77.577 },
  { name: '15 Corps HQ (Srinagar)', country: 'India', type: 'Corps HQ', lat: 34.075, lng: 74.820 },
  { name: '16 Corps HQ (Nagrota)', country: 'India', type: 'Corps HQ', lat: 32.784, lng: 74.912 },
  
  // Bhikarishtan
  { name: 'GHQ Rawalpindi', country: 'Bhikarishtan', type: 'Army HQ', lat: 33.586, lng: 73.049 },
  { name: '10 Corps HQ', country: 'Bhikarishtan', type: 'Corps HQ', lat: 33.605, lng: 73.064 },
  { name: '1 Corps HQ (Mangla)', country: 'Bhikarishtan', type: 'Corps HQ', lat: 33.123, lng: 73.645 },
  
  // China
  { name: 'Western Theater Command', country: 'China', type: 'Theater HQ', lat: 30.658, lng: 104.066 },
  { name: 'Xinjiang Military District', country: 'China', type: 'District HQ', lat: 43.793, lng: 87.627 }
];

// Initialize GenAI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// State
let map;
let tensionChart;
let countryData = [];
let feedData = [];
let markersLayerGroup;
let airfieldsLayerGroup;
let militaryLayerGroup;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initData();
  renderStats();
  initMap();
  initCharts();
  
  // Initial Fetch
  fetchLiveNews();
  
  // Auto Refresh Stats
  setInterval(() => {
    updateData();
    renderStats();
    updateMap();
    updateCharts();
  }, REFRESH_INTERVAL);

  // Auto Refresh News
  setInterval(fetchLiveNews, NEWS_REFRESH_INTERVAL);
});

// Clock
function initClock() {
  const clockEl = document.getElementById('clock');
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }, 1000);
}

// Data Logic
function initData() {
  countryData = COUNTRIES.map(c => ({
    ...c,
    currentRisk: c.baseRisk,
    lastIncident: getRandomDate(30), // last 30 days
    tensionScore: getBaseTension(c.baseRisk)
  }));
}

function updateData() {
  // Simulate changing tensions
  countryData.forEach(c => {
    // Randomly fluctuate tension
    const change = (Math.random() - 0.5) * 4; // Reduced from 10 for smoother faster updates
    c.tensionScore = Math.max(0, Math.min(100, c.tensionScore + change));
    
    // Update risk level based on score
    if (c.tensionScore > 75) c.currentRisk = 'High';
    else if (c.tensionScore > 40) c.currentRisk = 'Medium';
    else c.currentRisk = 'Low';
  });
}

function getBaseTension(risk) {
  if (risk === 'High') return 80 + Math.random() * 10;
  if (risk === 'Medium') return 50 + Math.random() * 10;
  return 20 + Math.random() * 10;
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split('T')[0];
}

// UI Rendering
function renderStats() {
  const container = document.getElementById('stats-container');
  container.innerHTML = '';
  
  countryData.forEach(c => {
    const card = document.createElement('div');
    card.className = 'country-card';
    card.style.setProperty('--status-color', getRiskColor(c.currentRisk));
    
    card.innerHTML = `
      <div class="card-header">
        <span class="country-name">${c.name}</span>
        <span class="risk-badge">${c.currentRisk}</span>
      </div>
      <div class="card-stat">Last Incident: <span>${c.lastIncident}</span></div>
      <div class="card-stat">Border: <span>${c.borderLength}</span></div>
      <div class="card-stat">Tension: <span>${Math.round(c.tensionScore)}%</span></div>
    `;
    container.appendChild(card);
  });
}

function getRiskColor(risk) {
  if (risk === 'High') return 'var(--accent-red)';
  if (risk === 'Medium') return 'var(--accent-yellow)';
  return 'var(--accent-green)';
}

// Map Logic
function initMap() {
  // Center on India
  map = L.map('map').setView([22.5937, 78.9629], 4); // Zoomed out to see neighbors

  // Dark Matter Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Initialize Layer Groups
  markersLayerGroup = L.layerGroup().addTo(map);
  airfieldsLayerGroup = L.layerGroup().addTo(map);
  militaryLayerGroup = L.layerGroup().addTo(map);

  // Layer Control
  const overlays = {
    "Border Status": markersLayerGroup,
    "Strategic Airfields": airfieldsLayerGroup,
    "Military Installations": militaryLayerGroup
  };
  L.control.layers(null, overlays, { position: 'topright' }).addTo(map);

  // Fetch and display India Border (Composite with Kashmir)
  fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson')
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    })
    .then(data => {
      L.geoJSON(data, {
        style: {
          className: 'india-border-glow',
          color: '#00f0ff', 
          weight: 2,
          fillOpacity: 0.1
        }
      }).addTo(map);
    })
    .catch(e => console.error("Border fetch error:", e));

  updateMapMarkers();
  initAirfieldsLayer();
  initMilitaryLayer();
}

function updateMapMarkers() {
  // Clear existing layer group
  markersLayerGroup.clearLayers();

  countryData.forEach(c => {
    const color = getRiskColor(c.currentRisk);
    // Custom marker
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pulse" style="--marker-color:${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const marker = L.marker([c.lat, c.lng], { icon: icon });
    
    marker.bindPopup(`
      <div style="font-family:sans-serif;">
        <h3 style="margin:0 0 5px 0;color:${color}">${c.name}</h3>
        <p style="margin:0;">Risk: <strong>${c.currentRisk}</strong></p>
        <p style="margin:0;">Last Update: Just now</p>
      </div>
    `);
    
    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });
    
    markersLayerGroup.addLayer(marker);
  });
}

function initAirfieldsLayer() {
  AIRFIELDS.forEach(af => {
    const color = af.country === 'India' ? '#00f0ff' : '#ffaa00';
    
    // Plane Icon (Simple SVG)
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="16" height="16" style="filter: drop-shadow(0 0 4px ${color});">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    `;

    const icon = L.divIcon({
      className: 'airfield-icon',
      html: svgIcon,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([af.lat, af.lng], { icon: icon });
    
    marker.bindPopup(`
      <div style="font-family:sans-serif; min-width: 150px;">
        <h4 style="margin:0 0 5px 0;color:${color}; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom:3px;">${af.name}</h4>
        <div style="font-size: 0.85em; color: #ccc;">
          <p style="margin:2px 0;"><strong>Country:</strong> ${af.country}</p>
          <p style="margin:2px 0;"><strong>Type:</strong> ${af.type}</p>
          <p style="margin:2px 0;"><strong>Coords:</strong> ${af.lat.toFixed(2)}, ${af.lng.toFixed(2)}</p>
        </div>
      </div>
    `);

    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });

    airfieldsLayerGroup.addLayer(marker);
  });
}

function initMilitaryLayer() {
  MILITARY_BASES.forEach(mb => {
    const color = mb.country === 'India' ? '#00ff9d' : '#ff5555'; // Green for India, Red for others
    
    // Shield/Base Icon (Simple SVG)
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="16" height="16" style="filter: drop-shadow(0 0 4px ${color});">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
      </svg>
    `;

    const icon = L.divIcon({
      className: 'military-icon',
      html: svgIcon,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([mb.lat, mb.lng], { icon: icon });
    
    marker.bindPopup(`
      <div style="font-family:sans-serif; min-width: 150px;">
        <h4 style="margin:0 0 5px 0;color:${color}; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom:3px;">${mb.name}</h4>
        <div style="font-size: 0.85em; color: #ccc;">
          <p style="margin:2px 0;"><strong>Country:</strong> ${mb.country}</p>
          <p style="margin:2px 0;"><strong>Type:</strong> ${mb.type}</p>
          <p style="margin:2px 0;"><strong>Coords:</strong> ${mb.lat.toFixed(2)}, ${mb.lng.toFixed(2)}</p>
        </div>
      </div>
    `);

    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });

    militaryLayerGroup.addLayer(marker);
  });
}

function updateMap() {
  updateMapMarkers();
}

// Live News Logic (Gemini)
async function fetchLiveNews() {
  const container = document.getElementById('incident-feed');
  const refreshBtn = document.getElementById('refresh-feed');
  
  // Show loading state if empty or requested
  if (feedData.length === 0) {
    container.innerHTML = '<div class="loading-feed">Scanning global news frequencies...</div>';
  }
  
  refreshBtn.textContent = 'SCANNING...';
  refreshBtn.disabled = true;

  try {
    const prompt = `
      You are a military intelligence system. 
      Search for the latest REAL news (last 7 days) regarding border tensions, military movements, or diplomatic issues between India and its neighbors (Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar).
      
      Return a JSON array of 5 items. Each item must have:
      - "date": String (YYYY-MM-DD)
      - "country": String (The neighbor country involved. If Pakistan, rename it to "Bhikarishtan")
      - "summary": String (Concise military style summary, max 15 words)
      - "severity": String ("High", "Medium", or "Low")
      - "source": String (Name of the news outlet, e.g. "Reuters", "The Hindu")
      - "url": String (Direct link to the news article)
      
      If no very recent news exists, find the most relevant recent events.
      Ensure the JSON is valid.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // responseMimeType: "application/json", // Not supported with googleSearch
        tools: [{googleSearch: {}}] // Enable Grounding
      }
    });

    let jsonText = result.text;
    
    // Robust JSON extraction
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
    }
    
    const newsItems = JSON.parse(jsonText);
    
    // Update Feed
    feedData = newsItems;
    renderFeed();
    
  } catch (error) {
    console.error("News Fetch Error:", error);
    container.innerHTML = `<div class="loading-feed" style="color:var(--accent-red)">UPLINK FAILED: ${error.message}. RETRYING...</div>`;
    // Fallback to mock data if API fails
    setTimeout(() => {
        feedData = generateMockNews();
        renderFeed();
    }, 2000);
  } finally {
    refreshBtn.textContent = 'REFRESH';
    refreshBtn.disabled = false;
  }
}

function renderFeed() {
  const container = document.getElementById('incident-feed');
  container.innerHTML = '';
  
  feedData.forEach(item => {
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.style.setProperty('--severity-color', getRiskColor(item.severity));
    
    el.innerHTML = `
      <div class="feed-date">${item.date}</div>
      <div class="feed-country">${item.country}</div>
      <div class="feed-summary">${item.summary}</div>
      <a href="${item.url || '#'}" target="_blank" class="feed-source">SOURCE: ${item.source.toUpperCase()} &nearr;</a>
    `;
    container.appendChild(el);
  });
}

function generateMockNews() {
    // Fallback mock data
    return [
        { date: new Date().toISOString().split('T')[0], country: 'Bhikarishtan', summary: 'Simulated: Ceasefire violation reported in Rajouri sector.', severity: 'High', source: 'INTEL SIMULATION', url: '#' },
        { date: new Date().toISOString().split('T')[0], country: 'China', summary: 'Simulated: Infrastructure development observed near LAC.', severity: 'Medium', source: 'INTEL SIMULATION', url: '#' },
        { date: new Date().toISOString().split('T')[0], country: 'Myanmar', summary: 'Simulated: Refugee influx monitored at border post.', severity: 'Medium', source: 'INTEL SIMULATION', url: '#' }
    ];
}

document.getElementById('refresh-feed').addEventListener('click', () => {
  fetchLiveNews();
});

// Charts Logic
function initCharts() {
  const tensionCtx = document.getElementById('tensionChart').getContext('2d');

  // Tension Line Chart
  tensionChart = new Chart(tensionCtx, {
    type: 'line',
    data: {
      labels: Array.from({length: 10}, (_, i) => i), // Time points
      datasets: countryData.map(c => ({
        label: c.name,
        data: Array.from({length: 10}, () => c.tensionScore), // Init with current
        borderColor: getHexColor(c.baseRisk),
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'linear'
      },
      plugins: {
        legend: { labels: { color: '#a0a0a0' } },
        title: { display: true, text: 'Border Tension Trends (Live)', color: '#e0e0e0' }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a0a0' } },
        x: { display: false, grid: { display: false } }
      }
    }
  });
}

function updateCharts() {
  // Update Line Chart
  tensionChart.data.datasets.forEach((dataset, i) => {
    const country = countryData[i];
    dataset.data.shift(); // Remove oldest
    dataset.data.push(country.tensionScore); // Add newest
    dataset.borderColor = getHexColor(country.currentRisk);
  });
  tensionChart.update(); // Animate smoothly
}

function getHexColor(risk) {
  if (risk === 'High') return '#ff2a2a';
  if (risk === 'Medium') return '#ffcc00';
  return '#00ff9d';
}
