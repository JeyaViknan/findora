import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Search, Navigation, X } from "lucide-react";

function LocationPicker({ 
  center = [40.7128, -74.0060], 
  zoom = 13, 
  onLocationSelect, 
  selectedLocation,
  placeholder = "Search for a location or click on the map",
  title = "Select Location"
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [markers, setMarkers] = useState([]);

  // Initialize markers from selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setMarkers([{
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        id: 'selected'
      }]);
    }
  }, [selectedLocation]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            id: 'current'
          };
          setMarkers([location]);
          onLocationSelect(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your current location. Please select manually on the map.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Search for locations using Nominatim (OpenStreetMap)
  const searchLocation = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const results = await response.json();
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchLocation(query);
  };

  const handleSearchResultClick = (result) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      id: 'searched',
      address: result.display_name
    };
    setMarkers([location]);
    onLocationSelect(location);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newMarker = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          id: 'clicked'
        };
        setMarkers([newMarker]);
        onLocationSelect(newMarker);
        setSearchQuery(`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
        setShowSearchResults(false);
      }
    });
    return null;
  };

  const clearLocation = () => {
    setMarkers([]);
    setSearchQuery("");
    onLocationSelect(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={clearLocation}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {result.display_name}
                </div>
                <div className="text-xs text-gray-500">
                  {result.lat}, {result.lon}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Navigation className="h-4 w-4" />
          <span>Use Current Location</span>
        </button>
        <button
          type="button"
          onClick={clearLocation}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Map */}
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler />
          {markers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
            />
          ))}
        </MapContainer>
      </div>

      {/* Selected Location Info */}
      {markers.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800 flex items-center">
            <MapPin className="inline h-4 w-4 mr-1" />
            Selected location: {markers[0].lat.toFixed(6)}, {markers[0].lng.toFixed(6)}
            {markers[0].address && (
              <span className="ml-2 text-xs text-blue-600">
                ({markers[0].address})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
