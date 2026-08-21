/**
 * DocuFlow Central API Client Helper
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Constructs a full API endpoint URL.
 * @param path Endpoint path, e.g. '/api/tools/merge-pdf'
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Constructs a full download URL for an output file download endpoint.
 * @param downloadPath Relative or absolute download path, e.g. '/api/files/abc123/download'
 */
export function getDownloadUrl(downloadPath: string): string {
  if (!downloadPath) return '#';
  if (downloadPath.startsWith('http://') || downloadPath.startsWith('https://') || downloadPath.startsWith('data:')) {
    return downloadPath;
  }
  const normalizedPath = downloadPath.startsWith('/') ? downloadPath : `/${downloadPath}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}
