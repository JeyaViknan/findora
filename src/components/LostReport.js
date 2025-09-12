import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, MapPin, Upload, X, Camera } from "lucide-react";
import { reportLostItem } from "../api";

function LostReport() {
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    contactInfo: "",
    location: null,
    image: null,
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      navigate("/");
    }
  }, [navigate]);

  const categories = [
    "Electronics",
    "Clothing",
    "Accessories",
    "Documents",
    "Keys",
    "Books",
    "Sports Equipment",
    "Jewelry",
    "Other"
  ];

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newMarker = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          id: Date.now()
        };
        setMarkers([newMarker]);
        setFormData(prev => ({
          ...prev,
          location: newMarker
        }));
      }
    });
    return null;
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        image: acceptedFiles[0]
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.location) {
      setError("Please fill in all required fields and select a location on the map.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userEmail = localStorage.getItem("userEmail");
      await reportLostItem({
        ...formData,
        userEmail
      });
      
      alert("Lost item reported successfully!");
      navigate("/home");
    } catch (error) {
      console.error("Error reporting lost item:", error);
      setError("Failed to report lost item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">Report Lost Item</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information *
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="Phone number or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the lost item in detail (color, brand, size, distinctive features, etc.)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Location Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on the map to mark where you lost the item. You can add multiple locations if you're unsure.
            </p>
            
            <div className="h-96 w-full rounded-lg overflow-hidden border">
              <MapContainer
                center={[40.7128, -74.0060]} // Default to NYC
                zoom={13}
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
            
            {markers.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location selected: {markers[0].lat.toFixed(6)}, {markers[0].lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a photo of the lost item to help with identification.
            </p>

            {!formData.image ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {isDragActive
                    ? "Drop the image here..."
                    : "Drag & drop an image here, or click to select"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Report Lost Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default LostReport;