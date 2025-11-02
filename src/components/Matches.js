import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, X, MapPin } from "lucide-react";
import { getMatches, verifyMatch } from "../api";
import MatchInfo from "./MatchInfo";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getItemIdFromQuery = React.useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get('itemId');
  }, [location.search]);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      navigate("/");
      return;
    }
    const itemId = getItemIdFromQuery();
    loadMatches(userEmail, itemId);
  }, [navigate, location.search]);

  const loadMatches = async (userEmail, itemId) => {
    try {
      setLoading(true);
      const response = await getMatches(userEmail, itemId);
      const matchesData = response.data || [];
      console.log("Loaded matches:", matchesData);
      matchesData.forEach((match, index) => {
        console.log(`Match ${index}:`, {
          id: match.id,
          lostItemImageUrl: match.lostItem?.imageUrl,
          foundItemImageUrl: match.foundItem?.imageUrl,
          imageMatchScore: match.imageMatchScore,
          matchInfo: match.matchInfo
        });
      });
      setMatches(matchesData);
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Failed to load matches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMatch = async (matchId, isVerified) => {
    try {
      setVerifying(matchId);
      await verifyMatch(matchId, isVerified);
      
      // Update the match in the local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, verified: isVerified, status: isVerified ? 'verified' : 'rejected' }
            : match
        )
      );
      
      alert(isVerified ? "Match verified successfully!" : "Match rejected.");
    } catch (error) {
      console.error("Error verifying match:", error);
      alert("Failed to verify match. Please try again.");
    } finally {
      setVerifying(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
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
            <h1 className="ml-4 text-xl font-bold text-gray-900">Potential Matches</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600">
                We haven't found any potential matches for your lost items yet. 
                Check back later or make sure your lost item reports are detailed.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Found {matches.length} potential match{matches.length !== 1 ? 'es' : ''}
              </h2>
              <p className="text-gray-600">
                Review the items below to see if any match your lost items.
              </p>
            </div>

            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {match.foundItem?.category || 'Unknown Category'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">
                        {match.foundItem?.description || 'No description available'}
                      </p>
                    </div>
                    {match.foundItem?.imageUrl && (
                      <img
                        src={match.foundItem.imageUrl}
                        alt="Found item"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  {/* Image Comparison Section */}
                  {(match.lostItem?.imageUrl || match.foundItem?.imageUrl) && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Image Comparison</h4>
                      {match.lostItem?.imageUrl && match.foundItem?.imageUrl ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Your Lost Item</p>
                            <img
                              src={match.lostItem.imageUrl}
                              alt="Lost item"
                              className="w-full h-48 object-cover rounded-lg border-2 border-blue-200"
                              onError={(e) => {
                                console.error('Failed to load lost item image:', match.lostItem.imageUrl);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded lost item image:', match.lostItem.imageUrl);
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Found Item</p>
                            <img
                              src={match.foundItem.imageUrl}
                              alt="Found item"
                              className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                              onError={(e) => {
                                console.error('Failed to load found item image:', match.foundItem.imageUrl);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded found item image:', match.foundItem.imageUrl);
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {!match.lostItem?.imageUrl && <p>Lost item image not available</p>}
                          {!match.foundItem?.imageUrl && <p>Found item image not available</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Your Lost Item</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Category:</strong> {match.lostItem?.category}</p>
                        <p><strong>Description:</strong> {match.lostItem?.description}</p>
                        <p><strong>Lost on:</strong> {formatDate(match.lostItem?.createdAt)}</p>
                        {match.lostItem?.imageUrl && (
                          <img
                            src={match.lostItem.imageUrl}
                            alt="Lost item"
                            className="mt-2 w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Found Item Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Found on:</strong> {formatDate(match.foundItem?.createdAt)}</p>
                        <p><strong>Found by:</strong> {match.foundItem?.userEmail}</p>
                        <p><strong>Contact:</strong> {match.foundItem?.contactInfo}</p>
                        <p><strong>Status:</strong> {match.foundItem?.foundOption}</p>
                        {match.foundItem?.imageUrl && !match.lostItem?.imageUrl && (
                          <img
                            src={match.foundItem.imageUrl}
                            alt="Found item"
                            className="mt-2 w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  {match.foundItem?.location && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Found Location
                      </h4>
                      <p className="text-sm text-gray-600">
                        Latitude: {match.foundItem.location.lat?.toFixed(6)}, 
                        Longitude: {match.foundItem.location.lng?.toFixed(6)}
                      </p>
                      {match.foundItem.vendorInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Vendor:</strong> {match.foundItem.vendorInfo}
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Match Analysis */}
                  <div className="mb-6">
                    <MatchInfo 
                      matchInfo={match.matchInfo} 
                      score={match.score} 
                      imageMatchScore={match.imageMatchScore !== null && match.imageMatchScore !== undefined 
                        ? (typeof match.imageMatchScore === 'number' ? match.imageMatchScore : null)
                        : null}
                    />
                  </div>

                  {/* Action Buttons */}
                  {match.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleVerifyMatch(match.id, true)}
                        disabled={verifying === match.id}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {verifying === match.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>This is my item</span>
                      </button>
                      
                      <button
                        onClick={() => handleVerifyMatch(match.id, false)}
                        disabled={verifying === match.id}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {verifying === match.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>Not my item</span>
                      </button>
                    </div>
                  )}

                  {match.status === 'verified' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">
                        ✓ Match verified! Contact the finder using the provided contact information.
                      </p>
                    </div>
                  )}

                  {match.status === 'rejected' && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-red-800 font-medium">
                        ✗ Match rejected. This item was not yours.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Matches;