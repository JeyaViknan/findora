import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Eye, MapPin, Home, Store } from "lucide-react";
import { getUserFoundItems } from "../api";

function MyFoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      navigate("/");
      return;
    }
    loadFoundItems(userEmail);
  }, [navigate]);

  const loadFoundItems = async (userEmail) => {
    try {
      setLoading(true);
      const response = await getUserFoundItems(userEmail);
      setItems(response.data || []);
    } catch (error) {
      console.error("Error loading found items:", error);
      setError("Failed to load found items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFoundOptionIcon = (option) => {
    switch (option) {
      case 'keep':
        return Home;
      case 'location':
        return MapPin;
      case 'vendor':
        return Store;
      default:
        return Search;
    }
  };

  const getFoundOptionText = (option) => {
    switch (option) {
      case 'keep':
        return 'Keeping with me';
      case 'location':
        return 'Left at found location';
      case 'vendor':
        return 'Given to vendor/shop';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your found items...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="ml-4 text-xl font-bold text-gray-900">My Found Items</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No found items reported</h3>
              <p className="text-gray-600 mb-4">
                You haven't reported any found items yet.
              </p>
              <button
                onClick={() => navigate("/found-report")}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Report Found Item
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Your Found Items ({items.length})
              </h2>
              <p className="text-gray-600">
                Track the items you've found and reported.
              </p>
            </div>

            {items.map((item) => {
              const OptionIcon = getFoundOptionIcon(item.foundOption);
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.category}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Found
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {item.description}
                        </p>
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="Found item"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Item Information</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Category:</strong> {item.category}</p>
                          <p><strong>Contact:</strong> {item.contactInfo}</p>
                          <p><strong>Found on:</strong> {formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Handling Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <OptionIcon className="h-4 w-4" />
                            <span><strong>Status:</strong> {getFoundOptionText(item.foundOption)}</span>
                          </div>
                          {item.vendorInfo && (
                            <p><strong>Vendor:</strong> {item.vendorInfo}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    {item.location && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Found Location
                        </h4>
                        <p className="text-sm text-gray-600">
                          Latitude: {item.location.lat?.toFixed(6)}, 
                          Longitude: {item.location.lng?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    {/* Matches Information */}
                    {item.matches && item.matches.length > 0 && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Potential Matches ({item.matches.length})
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.matches.length} potential owner{item.matches.length !== 1 ? 's' : ''} have been notified about this item.
                        </p>
                        <button
                          onClick={() => navigate("/matches")}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Matches →
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => navigate("/matches")}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Matches</span>
                      </button>
                      
                      <button
                        onClick={() => navigate("/found-report")}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center justify-center space-x-2"
                      >
                        <Search className="h-4 w-4" />
                        <span>Edit Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyFoundItems;