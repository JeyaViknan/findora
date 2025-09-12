import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, MapPin, Calendar, Filter } from "lucide-react";
import { searchItems } from "../api";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    type: "all", // all, lost, found
    dateRange: "all" // all, today, week, month
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await searchItems(query);
      setResults(response.data || []);
    } catch (error) {
      console.error("Error searching items:", error);
      setError("Failed to search items. Please try again.");
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

  const getTypeColor = (type) => {
    return type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const getTypeIcon = (type) => {
    return type === 'lost' ? '🔍' : '✅';
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
            <h1 className="ml-4 text-xl font-bold text-gray-900">Search Items</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for lost or found items..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SearchIcon className="h-4 w-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Filters Toggle */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Items</option>
                    <option value="lost">Lost Items</option>
                    <option value="found">Found Items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Search Results for "{query}"
              </h2>
              <p className="text-gray-600">
                {loading ? "Searching..." : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                  <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              </div>
            ) : (
              results.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.category}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)} {item.type === 'lost' ? 'Lost' : 'Found'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {item.description}
                        </p>
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.type === 'lost' ? 'Lost item' : 'Found item'}
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
                          <p><strong>Posted:</strong> {formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          {item.location ? (
                            <>
                              <p><strong>Latitude:</strong> {item.location.lat?.toFixed(6)}</p>
                              <p><strong>Longitude:</strong> {item.location.lng?.toFixed(6)}</p>
                            </>
                          ) : (
                            <p>No location data available</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info for Found Items */}
                    {item.type === 'found' && item.foundOption && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Handling Information</h4>
                        <p className="text-sm text-gray-600">
                          <strong>Status:</strong> {item.foundOption}
                        </p>
                        {item.vendorInfo && (
                          <p className="text-sm text-gray-600">
                            <strong>Vendor:</strong> {item.vendorInfo}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => navigate("/matches")}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          // In a real app, this would open a contact modal or redirect to contact page
                          alert(`Contact: ${item.contactInfo}`);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                      >
                        <SearchIcon className="h-4 w-4" />
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search Tips */}
        {!query && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Lost Items</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Include specific details like color, brand, size</li>
                  <li>• Mention distinctive features or markings</li>
                  <li>• Include the approximate location where you lost it</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Found Items</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Describe the item's condition and appearance</li>
                  <li>• Include where and when you found it</li>
                  <li>• Mention any identifying features</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;