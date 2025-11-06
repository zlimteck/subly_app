// Uses Google Favicons API to automatically fetch service logos from URLs

// Extract domain from a URL
export const extractDomain = (url) => {
  if (!url) return null

  try {
    // Add protocol if missing
    let processedUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = 'https://' + url
    }

    const urlObj = new URL(processedUrl)
    return urlObj.hostname.replace(/^www\./, '') // Remove www. prefix
  } catch (error) {
    return null
  }
}

// Get logo URL using Google Favicons API
export const getGoogleFaviconUrl = (domain, size = 128) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
}

// Get the best available logo for a subscription
export const getBestLogoUrl = (serviceUrl) => {
  // Try to get logo from URL using Google Favicons
  if (serviceUrl) {
    const domain = extractDomain(serviceUrl)
    if (domain) {
      return {
        url: getGoogleFaviconUrl(domain),
        source: 'google'
      }
    }
  }

  // No logo available - user will need to upload manually
  return {
    url: null,
    source: null
  }
}
