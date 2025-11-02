const natural = require('natural');
const nlp = require('compromise');
const Sentiment = require('sentiment');
const stringSimilarity = require('string-similarity');
const ImageMatcher = require('./image-matcher');

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Enhanced ML-powered matching service
class MLMatchingService {
  constructor() {
    // Initialize natural language processing tools
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    // Initialize image matcher
    this.imageMatcher = new ImageMatcher();
  }

  // Extract key features from text using NLP
  extractFeatures(text) {
    if (!text) return {};
    
    const doc = nlp(text || "");
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const stems = tokens.map(token => this.stemmer.stem(token));
    
    return {
      // Basic text features
      wordCount: tokens.length,
      uniqueWords: new Set(tokens).size,
      
      // NLP features
      nouns: doc.nouns().out('array') || [],
      adjectives: doc.adjectives().out('array') || [],
      entities: [
        ...((doc.people().out('array')) || []),
        ...((doc.places().out('array')) || [])
      ],
      
      // Stems for better matching
      stems: stems,
      
      // Sentiment analysis
      sentiment: sentiment.analyze(text),
      
      // Key phrases
      keyPhrases: this.extractKeyPhrases(text),
      
      // Color and brand extraction
      colors: this.extractColors(text),
      brands: this.extractBrands(text),
      
      // Material and condition
      materials: this.extractMaterials(text),
      conditions: this.extractConditions(text)
    };
  }

  // Extract key phrases from text
  extractKeyPhrases(text) {
    const phrases = [];
    const commonPhrases = [
      'cracked screen', 'black leather', 'silver chain', 'gold watch',
      'blue jeans', 'red shirt', 'white sneakers', 'brown wallet',
      'car keys', 'house keys', 'office keys', 'backpack',
      'laptop bag', 'phone case', 'sunglasses', 'headphones'
    ];
    
    commonPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        phrases.push(phrase);
      }
    });
    
    return phrases;
  }

  // Extract colors from text
  extractColors(text) {
    const colors = [
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
      'pink', 'brown', 'gray', 'grey', 'silver', 'gold', 'bronze', 'copper'
    ];
    
    return colors.filter(color => 
      text.toLowerCase().includes(color)
    );
  }

  // Extract brand names
  extractBrands(text) {
    const brands = [
      'apple', 'iphone', 'samsung', 'nike', 'adidas', 'gucci', 'prada',
      'louis vuitton', 'chanel', 'dior', 'versace', 'calvin klein',
      'ray ban', 'oakley', 'sony', 'lg', 'hp', 'dell', 'lenovo'
    ];
    
    return brands.filter(brand => 
      text.toLowerCase().includes(brand)
    );
  }

  // Extract materials
  extractMaterials(text) {
    const materials = [
      'leather', 'metal', 'plastic', 'wood', 'fabric', 'cotton', 'denim',
      'silk', 'wool', 'canvas', 'rubber', 'glass', 'ceramic', 'steel',
      'aluminum', 'titanium', 'gold', 'silver', 'diamond'
    ];
    
    return materials.filter(material => 
      text.toLowerCase().includes(material)
    );
  }

  // Extract condition descriptors
  extractConditions(text) {
    const conditions = [
      'new', 'used', 'old', 'worn', 'damaged', 'cracked', 'broken',
      'scratched', 'dirty', 'clean', 'perfect', 'excellent', 'good',
      'fair', 'poor', 'mint', 'pristine'
    ];
    
    return conditions.filter(condition => 
      text.toLowerCase().includes(condition)
    );
  }

  // Calculate advanced similarity between two items (now async to support image comparison)
  async calculateAdvancedSimilarity(lostItem, foundItem) {
    const lostFeatures = this.extractFeatures(lostItem.description);
    const foundFeatures = this.extractFeatures(foundItem.description);
    
    let totalScore = 0;
    let weightSum = 0;
    let imageSimilarity = 0;
    let hasImages = false;

    // Image similarity (25% weight) - only if both items have images
    // Use original imageUrl from items (relative path like /uploads/filename.jpg)
    // The imageMatcher will convert it to file system path
    const lostImageUrl = lostItem.imageUrl;
    const foundImageUrl = foundItem.imageUrl;
    
    if (lostImageUrl && foundImageUrl) {
      try {
        // Extract relative path if it's a full URL (for local server, images are stored with relative paths)
        const lostPath = lostImageUrl.includes('localhost') 
          ? lostImageUrl.replace(/^http:\/\/localhost:\d+/, '') 
          : lostImageUrl;
        const foundPath = foundImageUrl.includes('localhost') 
          ? foundImageUrl.replace(/^http:\/\/localhost:\d+/, '') 
          : foundImageUrl;
          
        console.log(`Comparing images: ${lostPath} vs ${foundPath}`);
        imageSimilarity = await this.imageMatcher.compareItemImages(lostPath, foundPath);
        console.log(`Image similarity result: ${imageSimilarity}`);
        hasImages = true;
        totalScore += imageSimilarity * 0.25;
        weightSum += 0.25;
      } catch (error) {
        console.error('Error comparing images:', error);
        console.error('Error stack:', error.stack);
        // If image comparison fails, continue without it
      }
    } else {
      console.log(`Skipping image comparison - lostItem.imageUrl: ${lostImageUrl}, foundItem.imageUrl: ${foundImageUrl}`);
    }

    // 1. Text similarity using multiple algorithms (adjusted weight: 25% if images, 35% if not)
    const textWeight = hasImages ? 0.25 : 0.35;
    const textSimilarity = this.calculateTextSimilarity(
      lostItem.description, 
      foundItem.description
    );
    totalScore += textSimilarity * textWeight;
    weightSum += textWeight;

    // 2. Key phrase matching (adjusted weight: 15% if images, 20% if not)
    const phraseWeight = hasImages ? 0.15 : 0.20;
    const phraseScore = this.calculatePhraseSimilarity(
      lostFeatures.keyPhrases, 
      foundFeatures.keyPhrases
    );
    totalScore += phraseScore * phraseWeight;
    weightSum += phraseWeight;

    // 3. Color matching (10% weight)
    const colorScore = this.calculateColorSimilarity(
      lostFeatures.colors, 
      foundFeatures.colors
    );
    totalScore += colorScore * 0.10;
    weightSum += 0.10;

    // 4. Brand matching (8% weight)
    const brandScore = this.calculateBrandSimilarity(
      lostFeatures.brands, 
      foundFeatures.brands
    );
    totalScore += brandScore * 0.08;
    weightSum += 0.08;

    // 5. Material matching (8% weight)
    const materialScore = this.calculateMaterialSimilarity(
      lostFeatures.materials, 
      foundFeatures.materials
    );
    totalScore += materialScore * 0.08;
    weightSum += 0.08;

    // 6. Condition matching (4% weight)
    const conditionScore = this.calculateConditionSimilarity(
      lostFeatures.conditions, 
      foundFeatures.conditions
    );
    totalScore += conditionScore * 0.04;
    weightSum += 0.04;

    // 7. Entity matching (4% weight)
    const entityScore = this.calculateEntitySimilarity(
      lostFeatures.entities, 
      foundFeatures.entities
    );
    totalScore += entityScore * 0.04;
    weightSum += 0.04;

    // 8. Sentiment similarity (1% weight if images, 6% if not)
    const sentimentWeight = hasImages ? 0.01 : 0.06;
    const sentimentScore = this.calculateSentimentSimilarity(
      lostFeatures.sentiment, 
      foundFeatures.sentiment
    );
    totalScore += sentimentScore * sentimentWeight;
    weightSum += sentimentWeight;

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

    return {
      score: finalScore,
      imageSimilarity: hasImages ? imageSimilarity : null,
      hasImages: hasImages
    };
  }

  // Calculate text similarity using multiple algorithms
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Jaccard similarity
    const jaccard = stringSimilarity.compareTwoStrings(text1, text2);
    
    // Cosine similarity
    const cosine = this.calculateCosineSimilarity(text1, text2);
    
    // Levenshtein distance similarity
    const levenshtein = 1 - (natural.LevenshteinDistance(text1, text2) / Math.max(text1.length, text2.length));
    
    // Average of all methods
    return (jaccard + cosine + levenshtein) / 3;
  }

  // Calculate cosine similarity
  calculateCosineSimilarity(text1, text2) {
    const tokens1 = this.tokenizer.tokenize(text1.toLowerCase());
    const tokens2 = this.tokenizer.tokenize(text2.toLowerCase());
    
    const allTokens = [...new Set([...tokens1, ...tokens2])];
    const vector1 = allTokens.map(token => tokens1.filter(t => t === token).length);
    const vector2 = allTokens.map(token => tokens2.filter(t => t === token).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    return magnitude1 === 0 || magnitude2 === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
  }

  // Calculate phrase similarity
  calculatePhraseSimilarity(phrases1, phrases2) {
    const a = Array.isArray(phrases1) ? phrases1 : (phrases1 ? [phrases1] : []);
    const b = Array.isArray(phrases2) ? phrases2 : (phrases2 ? [phrases2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(phrase => b.includes(phrase));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate color similarity
  calculateColorSimilarity(colors1, colors2) {
    const a = Array.isArray(colors1) ? colors1 : (colors1 ? [colors1] : []);
    const b = Array.isArray(colors2) ? colors2 : (colors2 ? [colors2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(color => b.includes(color));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate brand similarity
  calculateBrandSimilarity(brands1, brands2) {
    const a = Array.isArray(brands1) ? brands1 : (brands1 ? [brands1] : []);
    const b = Array.isArray(brands2) ? brands2 : (brands2 ? [brands2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(brand => b.includes(brand));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate material similarity
  calculateMaterialSimilarity(materials1, materials2) {
    const a = Array.isArray(materials1) ? materials1 : (materials1 ? [materials1] : []);
    const b = Array.isArray(materials2) ? materials2 : (materials2 ? [materials2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(material => b.includes(material));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate condition similarity
  calculateConditionSimilarity(conditions1, conditions2) {
    const a = Array.isArray(conditions1) ? conditions1 : (conditions1 ? [conditions1] : []);
    const b = Array.isArray(conditions2) ? conditions2 : (conditions2 ? [conditions2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(condition => b.includes(condition));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate entity similarity
  calculateEntitySimilarity(entities1, entities2) {
    const a = Array.isArray(entities1) ? entities1 : (entities1 ? [entities1] : []);
    const b = Array.isArray(entities2) ? entities2 : (entities2 ? [entities2] : []);
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const intersection = a.filter(entity => b.includes(entity));
    const union = [...new Set([...a, ...b])];
    
    return intersection.length / union.length;
  }

  // Calculate sentiment similarity
  calculateSentimentSimilarity(sentiment1, sentiment2) {
    if (!sentiment1 || !sentiment2) return 0;
    
    const score1 = sentiment1.score;
    const score2 = sentiment2.score;
    
    // Normalize scores to 0-1 range
    const normalized1 = (score1 + 5) / 10; // Assuming range is -5 to 5
    const normalized2 = (score2 + 5) / 10;
    
    return 1 - Math.abs(normalized1 - normalized2);
  }

  // Generate match explanation
  generateMatchExplanation(lostItem, foundItem, score, imageSimilarity = null) {
    const lostFeatures = this.extractFeatures(lostItem.description);
    const foundFeatures = this.extractFeatures(foundItem.description);
    
    const explanations = [];
    
    // Image match (add this first if available)
    if (imageSimilarity !== null && imageSimilarity !== undefined) {
      const imageMatchPercent = Math.round(imageSimilarity * 100);
      if (imageMatchPercent >= 70) {
        explanations.push(`Images show ${imageMatchPercent}% similarity - strong visual match`);
      } else if (imageMatchPercent >= 50) {
        explanations.push(`Images show ${imageMatchPercent}% similarity - moderate visual match`);
      } else if (imageMatchPercent >= 30) {
        explanations.push(`Images show ${imageMatchPercent}% similarity - some visual resemblance`);
      }
    }
    
    // Color match
    const commonColors = lostFeatures.colors.filter(color => 
      foundFeatures.colors.includes(color)
    );
    if (commonColors.length > 0) {
      explanations.push(`Both items are described as ${commonColors.join(', ')}`);
    }
    
    // Brand match
    const commonBrands = lostFeatures.brands.filter(brand => 
      foundFeatures.brands.includes(brand)
    );
    if (commonBrands.length > 0) {
      explanations.push(`Both items are ${commonBrands.join(', ')} brand`);
    }
    
    // Material match
    const commonMaterials = lostFeatures.materials.filter(material => 
      foundFeatures.materials.includes(material)
    );
    if (commonMaterials.length > 0) {
      explanations.push(`Both items are made of ${commonMaterials.join(', ')}`);
    }
    
    // Key phrase match
    const commonPhrases = lostFeatures.keyPhrases.filter(phrase => 
      foundFeatures.keyPhrases.includes(phrase)
    );
    if (commonPhrases.length > 0) {
      explanations.push(`Both descriptions mention: "${commonPhrases.join('", "')}"`);
    }
    
    // Condition match
    const commonConditions = lostFeatures.conditions.filter(condition => 
      foundFeatures.conditions.includes(condition)
    );
    if (commonConditions.length > 0) {
      explanations.push(`Both items are described as ${commonConditions.join(', ')}`);
    }
    
    // Location proximity
    if (lostItem.location && foundItem.location) {
      const distance = this.calculateLocationDistance(lostItem.location, foundItem.location);
      if (distance < 1) {
        explanations.push(`Found very close to where you lost it (${(distance * 1000).toFixed(0)}m away)`);
      } else if (distance < 5) {
        explanations.push(`Found within ${distance.toFixed(1)}km of where you lost it`);
      }
    }
    
    // Time proximity
    const timeDiff = Math.abs(new Date(lostItem.createdAt) - new Date(foundItem.createdAt));
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff <= 1) {
      explanations.push(`Found within 24 hours of when you lost it`);
    } else if (daysDiff <= 7) {
      explanations.push(`Found within ${Math.round(daysDiff)} days of when you lost it`);
    }
    
    // Default explanation if no specific matches
    if (explanations.length === 0) {
      if (score > 0.7) {
        explanations.push(`High similarity in description and characteristics`);
      } else if (score > 0.5) {
        explanations.push(`Moderate similarity in description and characteristics`);
      } else {
        explanations.push(`Some similarity in description and characteristics`);
      }
    }
    
    return {
      explanations,
      confidence: this.getConfidenceLevel(score),
      score: Math.round(score * 100),
      imageSimilarity: imageSimilarity !== null ? Math.round(imageSimilarity * 100) : null
    };
  }

  // Get confidence level description
  getConfidenceLevel(score) {
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    if (score >= 0.2) return 'Low';
    return 'Very Low';
  }

  // Calculate location distance (reused from original)
  calculateLocationDistance(loc1, loc2) {
    if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) {
      return 1;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
}

module.exports = MLMatchingService;
