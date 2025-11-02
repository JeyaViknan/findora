import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, Star, MapPin, Clock, Palette, Tag, Image } from 'lucide-react';

function MatchInfo({ matchInfo, score, imageMatchScore }) {
  // Debug logging - must be called before any early returns
  useEffect(() => {
    if (matchInfo) {
      console.log('MatchInfo props:', { matchInfo, score, imageMatchScore });
    }
  }, [matchInfo, score, imageMatchScore]);

  if (!matchInfo) return null;

  const { explanations, confidence, score: matchScore, imageSimilarity } = matchInfo;
  
  // Use imageSimilarity from matchInfo if available, otherwise use imageMatchScore prop
  // Handle both percentage (0-100) and decimal (0-1) formats
  let imageMatch = null;
  
  if (imageSimilarity !== null && imageSimilarity !== undefined) {
    // imageSimilarity from matchInfo is already a percentage (0-100)
    imageMatch = typeof imageSimilarity === 'number' ? imageSimilarity : null;
  } else if (imageMatchScore !== null && imageMatchScore !== undefined) {
    // imageMatchScore is a decimal (0-1), convert to percentage
    imageMatch = typeof imageMatchScore === 'number' 
      ? Math.round(imageMatchScore * 100) 
      : null;
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'Very High':
        return 'text-green-600 bg-green-50';
      case 'High':
        return 'text-green-600 bg-green-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-orange-600 bg-orange-50';
      case 'Very Low':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'Very High':
      case 'High':
        return <CheckCircle className="h-4 w-4" />;
      case 'Medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'Low':
      case 'Very Low':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h4 className="font-semibold text-gray-900">AI Match Analysis</h4>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
          {getConfidenceIcon(confidence)}
          <span>{confidence} Confidence</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Match Score and Image Match Score */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">Overall Match Score: {matchScore || Math.round(score * 100)}%</span>
          </div>
          
          {imageMatch !== null && imageMatch !== undefined ? (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
              imageMatch >= 70 
                ? 'bg-green-100 text-green-800' 
                : imageMatch >= 50 
                ? 'bg-yellow-100 text-yellow-800' 
                : imageMatch >= 30
                ? 'bg-orange-100 text-orange-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <Image className="h-4 w-4" />
              <span className="font-semibold text-sm">
                Image Match: {imageMatch}%
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">
              <Image className="h-4 w-4" />
              <span className="font-semibold text-sm">
                Image comparison not available
              </span>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Why this might be your item:</p>
          <ul className="space-y-1">
            {explanations.map((explanation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>{explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center space-x-4 text-xs text-gray-500 flex-wrap gap-2">
          {imageMatch !== null && (
            <div className="flex items-center space-x-1">
              <Image className="h-3 w-3" />
              <span>Image Comparison</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Palette className="h-3 w-3" />
            <span>Color Analysis</span>
          </div>
          <div className="flex items-center space-x-1">
            <Tag className="h-3 w-3" />
            <span>Brand Detection</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>Location Proximity</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Time Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchInfo;
