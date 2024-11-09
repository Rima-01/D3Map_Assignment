// The given URL for the JSON feed from which we are fetching the towns.
const baseApiUrl = "http://34.147.162.172/Circles/Towns/";

// Have set an initial number of towns to fetch
let numberOfTowns = 50;

// Initialized the Leaflet map, centered at Latitude 54.0 and Longitude at -2.0 on the UK map
//with zoom level of 6.
const map = L.map('map').setView([54.0, -2.0], 6); 

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Debounce function to limit the frequency of API calls
function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Function to retrieve town data from the given API and plot these towns on the map.
async function fetchAndPlotTowns() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';

        const apiUrl = `${baseApiUrl}${numberOfTowns}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const towns = await response.json();

        // Function to clear previous location circle markers.
        map.eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });

        towns.forEach(town => {
            if (town.lat && town.lng) {
                const popupContent = `
                    <b>${town.Town}</b><br>
                    County: ${town.County}<br>
                    Population: ${town.Population || "Unknown"}
                `;
                
                const circleMarker = L.circleMarker([town.lat, town.lng], {
                    radius: scalePopulation(town.Population),
                    color: 'red',
                    fillColor: 'red',
                    fillOpacity: 0.7,
                    className: 'pulsing-marker'
                })
                .addTo(map)
                .bindPopup(popupContent);
                
//                circleMarker.on('click', function() {
                  circleMarker.on('mouseover', function() {
                    circleMarker.openPopup();
                });
            } else {
                console.warn(`Invalid coordinates for town: ${town.Town}`);
            }
        });

        add_Pulsing_Animation();

    } catch (error) {
        console.error('Error fetching or plotting towns:', error);
          alert("Unable to load towns. Please try again later.");
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

// Function to display the position(circlemarker) circles according to the size of the population.
function scalePopulation(population) {
    if (!population) return 5;
    return Math.sqrt(population) * 0.05;
}

// Function to add a reload button to the UK map which will load different set of towns on every click.
function add_Reload_Button() {
    const reloadButton = L.control({ position: 'topright' });

    reloadButton.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-control-button');
        div.innerHTML = 'Reload Towns';
        div.onclick = () => {
            fetchAndPlotTowns();
        };
        return div;
    };

    reloadButton.addTo(map);
}

// Function to handle slider input with debounce to restrict the frequency of call to 'fetchAndPlotTowns' 
// or the API calls with a time delay of 300 ms to avoid the multiple frequency call error.
function add_Town_Slider_button() {
    const slider = d3.select('#townSlider');
    const townCountDisplay = d3.select('#townCount');

    slider.on('input', debounce(function () {
        numberOfTowns = this.value;
        townCountDisplay.text(numberOfTowns);
        fetchAndPlotTowns();
    }, 300));
}

// Function to add a pulsing animation effect on the town markers and stop any furthur recursive calls.
function add_Pulsing_Animation() {
    const markers = d3.selectAll('.pulsing-marker');

    markers.each(function() {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr("r", function() {
                const currentRadius = d3.select(this).attr("r") || 5;
                return +currentRadius + 2;
            })
            .attr("fill-opacity", 0.5)
            .transition()
            .duration(1000)
            .attr("r", function() {
                const currentRadius = d3.select(this).attr("r") || 5;
                return currentRadius - 2;
            })
            .attr("fill-opacity", 0.7)
            .on("end", function() {
                d3.select(this).interrupt(); 
            });
    });
}

// Initialize the map by fetching and plotting towns.
fetchAndPlotTowns();
add_Reload_Button();
add_Town_Slider_button();
