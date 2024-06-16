let map;
let autocomplete;
let markers = [];
let circles = [];

function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
}

function clearCircles() {
    circles.forEach((circle) => circle.setMap(null));
    circles = [];
}

function initializeMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 7.8731, lng: 80.7718 },
        zoom: 8,
    });

    const searchInput = document.getElementById("autocomplete-input");
    autocomplete = new google.maps.places.Autocomplete(searchInput, {
        componentRestrictions: { country: "lk" },
        fields: ["geometry.location", "name"],
        types: ["establishment", "geocode"],
    });

    autocomplete.addListener("place_changed", onPlaceChanged);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    name: "Your location",
                };

                displayNearestLocations(location);
            },
            (error) => {
                console.error("Error getting current position:", error);
                if (error.code === 1) {
                    alert("Please enable location services to use this feature.");
                }
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function onPlaceChanged() {
    markers = [];
    circles = [];

    clearMarkers();
    clearCircles();

    const place = autocomplete.getPlace();

    if (!place.geometry) {
        alert("No details available for input: '" + place.name + "'");
        return;
    }

    const location = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        name: place.name,
    };

    displayNearestLocations(location);
}

function displayNearestLocations(location) {
    clearMarkers();
    clearCircles();

    markers = [];
    circles = [];

    const hostName = window.location.host;

    const apiEndpoint = `/api/get-dealer-locations`;
    const requestUrl = apiEndpoint;

    fetch(requestUrl)
        .then((response) => response.json())
        .then((data) => {
            var dataInData = data.data;
            const nearestLocations = findNearestLocations(dataInData, location, 5);

            map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: 7.8731, lng: 80.7718 },
                zoom: 8,
            });

            const searchMarker = new google.maps.Marker({
                position: { lat: location.latitude, lng: location.longitude },
                map: map,
                icon: {
                    url: "blue-dot.png",
                },
            });

            markers.push(searchMarker);

            const locationsList = document.createElement("ul");
            nearestLocations.forEach((location) => {
                const listItem = document.createElement("li");
                const link = document.createElement("a");
                const phone = location.phoneNumber;

                link.href = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
                link.target = "_blank";
                link.title = "Get Directions"
                link.innerHTML = `<i class="bi bi-sign-turn-right-fill"></i> ${location.name}`;
                listItem.appendChild(link, phone);
                locationsList.appendChild(listItem);

                const addSpan = document.createElement("span");
                addSpan.innerHTML = ` <p style="font-size:12px; margin-bottom:5px; color: #203b8f;">  ${location.address || 'N/A'}</p>`;
                listItem.appendChild(addSpan);

                const phoneSpan = document.createElement("span");
                phoneSpan.innerHTML = `   <a  href="tel:${phone || 'N/A'}"> <i class="bi bi-telephone-outbound-fill"></i> &nbsp; ${phone} </a>`;
                listItem.appendChild(phoneSpan);

                const marker = new google.maps.Marker({
                    position: { lat: location.latitude, lng: location.longitude },
                    title: location.name,
                    map: map,
                });

                markers.push(marker);

                const infowindow = new google.maps.InfoWindow();
                marker.addListener('click', () => {
                    infowindow.setContent(
                        `<div>
            <h6>${location.name}</h6>
            <p>Phone: <a  href="tel:${location.phoneNumber}"> ${location.phoneNumber} </a></p>
           <p>Address: ${location.address || 'N/A'}</p>
        </div>`
                    );
                    infowindow.open(map, marker);
                });
            });

            searchCircle = new google.maps.Circle({
                strokeColor: "#4285F4",
                strokeOpacity: 0.3,
                strokeWeight: 2,
                fillColor: "#4285F4",
                fillOpacity: 0.10,
                map: map,
                center: { lat: location.latitude, lng: location.longitude },
                radius: 3000,
            });

            const nearbyLocationsDiv = document.getElementById("nearby-locations");
            nearbyLocationsDiv.innerHTML = "";
            nearbyLocationsDiv.appendChild(locationsList);

            const bounds = new google.maps.LatLngBounds();
            markers.forEach((marker) => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
        })
        .catch((error) => {
            console.error("Error fetching locations:", error);
        });
}

function findNearestLocations(locations, targetLocation, count) {
    const distances = locations.map((location) => {
        const dx = location.latitude - targetLocation.latitude;
        const dy = location.longitude - targetLocation.longitude;
        return {
            location: location,
            distance: Math.sqrt(dx * dx + dy * dy),
        };
    });

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, count).map((item) => item.location);
}

// Call the initialization function when the page loads
window.onload = initializeMap;
