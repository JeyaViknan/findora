const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Lightweight image comparison module using histogram-based similarity
 * This provides fast, lightweight image matching suitable for lost & found items
 */
class ImageMatcher {
  constructor() {
    // Standard size for comparison (smaller = faster, but less accurate)
    this.comparisonSize = 64; // 64x64 pixels for fast comparison
    this.histogramBins = 32; // Number of bins for color histogram (R, G, B)
  }

  /**
   * Extract image features (histogram) for comparison
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} - Image features (histogram)
   */
  async extractFeatures(imagePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        return null;
      }

      // Resize image to standard size for faster processing
      const resized = await sharp(imagePath)
        .resize(this.comparisonSize, this.comparisonSize, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resized;
      const { width, height, channels } = info;

      // Extract RGB histogram
      const histogram = {
        r: new Array(this.histogramBins).fill(0),
        g: new Array(this.histogramBins).fill(0),
        b: new Array(this.histogramBins).fill(0)
      };

      // Build histograms
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        histogram.r[Math.floor((r / 256) * this.histogramBins)]++;
        histogram.g[Math.floor((g / 256) * this.histogramBins)]++;
        histogram.b[Math.floor((b / 256) * this.histogramBins)]++;
      }

      // Normalize histograms (convert to probabilities)
      const totalPixels = width * height;
      histogram.r = histogram.r.map(count => count / totalPixels);
      histogram.g = histogram.g.map(count => count / totalPixels);
      histogram.b = histogram.b.map(count => count / totalPixels);

      return {
        histogram,
        width,
        height
      };
    } catch (error) {
      console.error('Error extracting image features:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two histograms
   * @param {Array<number>} hist1 - First histogram
   * @param {Array<number>} hist2 - Second histogram
   * @returns {number} - Similarity score between 0 and 1
   */
  cosineSimilarity(hist1, hist2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < hist1.length; i++) {
      dotProduct += hist1[i] * hist2[i];
      magnitude1 += hist1[i] * hist1[i];
      magnitude2 += hist2[i] * hist2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Compare two images and return similarity score
   * @param {string} imagePath1 - Path to first image (should be absolute or properly resolved)
   * @param {string} imagePath2 - Path to second image (should be absolute or properly resolved)
   * @returns {Promise<number>} - Similarity score between 0 and 1
   */
  async compareImages(imagePath1, imagePath2) {
    try {
      // If either image doesn't exist, return 0 similarity
      if (!imagePath1 || !imagePath2) {
        return 0;
      }

      // Extract features from both images (paths should already be resolved)
      const features1 = await this.extractFeatures(imagePath1);
      const features2 = await this.extractFeatures(imagePath2);

      if (!features1 || !features2) {
        return 0;
      }

      // Compare RGB histograms
      const rSimilarity = this.cosineSimilarity(features1.histogram.r, features2.histogram.r);
      const gSimilarity = this.cosineSimilarity(features1.histogram.g, features2.histogram.g);
      const bSimilarity = this.cosineSimilarity(features1.histogram.b, features2.histogram.b);

      // Average of RGB similarities
      const avgSimilarity = (rSimilarity + gSimilarity + bSimilarity) / 3;

      // Apply additional structural comparison using edge detection
      const structuralSimilarity = await this.compareStructure(imagePath1, imagePath2);
      
      // Combine histogram similarity (70%) with structural similarity (30%)
      const finalScore = (avgSimilarity * 0.7) + (structuralSimilarity * 0.3);

      return Math.max(0, Math.min(1, finalScore));
    } catch (error) {
      console.error('Error comparing images:', error);
      return 0;
    }
  }

  /**
   * Compare image structure using edge detection
   * @param {string} imagePath1 - Path to first image
   * @param {string} imagePath2 - Path to second image
   * @returns {Promise<number>} - Structural similarity score between 0 and 1
   */
  async compareStructure(imagePath1, imagePath2) {
    try {
      const size = 32; // Smaller size for edge detection

      // Convert to grayscale and apply edge detection
      const edges1 = await sharp(imagePath1)
        .resize(size, size, { fit: 'cover' })
        .greyscale()
        .normalize()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
        })
        .raw()
        .toBuffer();

      const edges2 = await sharp(imagePath2)
        .resize(size, size, { fit: 'cover' })
        .greyscale()
        .normalize()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .raw()
        .toBuffer();

      // Calculate correlation between edge maps
      let correlation = 0;
      let sum1 = 0;
      let sum2 = 0;
      let sum1Sq = 0;
      let sum2Sq = 0;
      let sum12 = 0;

      const numPixels = edges1.length;

      for (let i = 0; i < numPixels; i++) {
        const val1 = edges1[i] / 255;
        const val2 = edges2[i] / 255;

        sum1 += val1;
        sum2 += val2;
        sum1Sq += val1 * val1;
        sum2Sq += val2 * val2;
        sum12 += val1 * val2;
      }

      const mean1 = sum1 / numPixels;
      const mean2 = sum2 / numPixels;

      const variance1 = (sum1Sq / numPixels) - (mean1 * mean1);
      const variance2 = (sum2Sq / numPixels) - (mean2 * mean2);
      const covariance = (sum12 / numPixels) - (mean1 * mean2);

      const std1 = Math.sqrt(variance1);
      const std2 = Math.sqrt(variance2);

      if (std1 === 0 || std2 === 0) {
        return 0;
      }

      correlation = covariance / (std1 * std2);
      return Math.max(0, (correlation + 1) / 2); // Normalize from [-1, 1] to [0, 1]
    } catch (error) {
      console.error('Error in structural comparison:', error);
      return 0;
    }
  }

  /**
   * Compare two item images from their URLs/paths
   * @param {string} imageUrl1 - URL or path to first image
   * @param {string} imageUrl2 - URL or path to second image
   * @returns {Promise<number>} - Similarity score between 0 and 1
   */
  async compareItemImages(imageUrl1, imageUrl2) {
    // If either image is missing, return 0
    if (!imageUrl1 || !imageUrl2) {
      return 0;
    }

    // Handle both relative and absolute paths
    // Images stored as /uploads/filename.jpg need to be resolved
    // For local server, images are stored in backend/uploads/ directory
    // Since this file is in backend/, __dirname points to backend/
    let path1 = imageUrl1;
    let path2 = imageUrl2;
    
    // If it's a path starting with /uploads/, resolve it relative to backend directory
    if (imageUrl1.startsWith('/uploads/')) {
      // Remove leading / and join with __dirname (which is backend/)
      path1 = path.join(__dirname, imageUrl1.substring(1));
    } else if (!path.isAbsolute(imageUrl1)) {
      // If it's a relative path without leading slash, assume it's in backend/uploads
      path1 = path.join(__dirname, 'uploads', imageUrl1);
    }
    
    if (imageUrl2.startsWith('/uploads/')) {
      path2 = path.join(__dirname, imageUrl2.substring(1));
    } else if (!path.isAbsolute(imageUrl2)) {
      path2 = path.join(__dirname, 'uploads', imageUrl2);
    }
    
    return await this.compareImages(path1, path2);
  }
}

module.exports = ImageMatcher;

