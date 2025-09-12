import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Bell, User, LogOut, Plus } from "lucide-react";
import { getUserLostItems, getUserFoundItems, getMatches } from "../api";

function Home() {
  const [userEmail, setUserEmail] = useState("");
  const [lostItemsCount, setLostItemsCount] = useState(0);
  const [foundItemsCount, setFoundItemsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      navigate("/");
      return;
    }
    setUserEmail(email);
    loadUserData(email);
  }, [navigate]);

  const loadUserData = async (email) => {
    try {
      setLoading(true);
      const [lostItems, foundItems, matches] = await Promise.all([
        getUserLostItems(email),
        getUserFoundItems(email),
        getMatches(email)
      ]);
      
      setLostItemsCount(lostItems.data?.length || 0);
      setFoundItemsCount(foundItems.data?.length || 0);
      setMatchesCount(matches.data?.length || 0);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Lost & Found</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/matches")}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="h-6 w-6" />
                {matchesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {matchesCount}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">{userEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userEmail.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Report lost items or found items to help others reconnect with their belongings.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Report Lost Item */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Lost Item</h3>
              <MapPin className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Lost something? Report it with location details and photos to help others find it.
            </p>
            <button
              onClick={() => navigate("/lost-report")}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Report Lost Item</span>
            </button>
          </div>

          {/* Report Found Item */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Found Item</h3>
              <Search className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Found something? Report it to help reunite it with its owner.
            </p>
            <button
              onClick={() => navigate("/found-report")}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Report Found Item</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lost Items</p>
                <p className="text-2xl font-bold text-gray-900">{lostItemsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Found Items</p>
                <p className="text-2xl font-bold text-gray-900">{foundItemsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Potential Matches</p>
                <p className="text-2xl font-bold text-gray-900">{matchesCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/my-lost-items")}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-red-500" />
                <span className="text-gray-900">View My Lost Items</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            
            <button
              onClick={() => navigate("/my-found-items")}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-green-500" />
                <span className="text-gray-900">View My Found Items</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            
            <button
              onClick={() => navigate("/matches")}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-blue-500" />
                <span className="text-gray-900">View Matches</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            
            <button
              onClick={() => navigate("/search")}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-purple-500" />
                <span className="text-gray-900">Search Items</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
