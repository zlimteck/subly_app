// Get the API base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Get the full URL for an uploaded file
 * @param {string} filename - The filename from the database
 * @returns {string} - The full URL to access the file
 */
export const getUploadUrl = (filename) => {
  if (!filename) return ''

  // If filename is already a full URL, return it
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename
  }

  // Build the full URL
  return `${API_URL}/api/uploads/${filename}`
}

/**
 * Get the API base URL
 * @returns {string} - The API base URL
 */
export const getApiUrl = () => API_URL

export default {
  getUploadUrl,
  getApiUrl
}