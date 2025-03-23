export function getFullUrl(path: string): string {
  if (path.startsWith('http')) {
    return path
  }
  
  if (typeof window === 'undefined') {
    return path
  }
  
  return `${window.location.protocol}//${window.location.host}${path}`
} 