// Cloudinary utility functions for frontend optimization
// Note: Image uploads are handled by existing backend APIs

/**
 * Generate Cloudinary transformation URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations: string[] = []
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not configured');
  }

  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}${publicId}`;
}

/**
 * Optimize image URL with common transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  // If it's already a Cloudinary URL, add transformations
  if (url.includes('res.cloudinary.com')) {
    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    
    // Add auto optimization if no specific format
    if (!options.format) {
      transformations.push('f_auto', 'q_auto');
    }

    if (transformations.length > 0) {
      // Insert transformations into the URL
      return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }
  }

  return url;
}
