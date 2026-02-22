/**
 * Production-Level ISBN Book Lookup System
 * ==========================================
 * Enterprise-grade utilities for fetching book metadata from multiple sources
 * with intelligent caching, retry logic, and graceful error handling.
 * 
 * Features:
 * - Multi-source lookup (Google Books + Open Library)
 * - Local caching with optional TTL
 * - Network retry with exponential backoff
 * - Smart result matching and scoring
 * - ISBN normalization (ISBN-10/13, with/without hyphens)
 * - Comprehensive error handling
 * - Professional debug logging
 */

import axios, { AxiosRequestConfig } from 'axios';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface BookMetadata {
  title: string;
  authors: string;
  publisher: string;
  publishedDate: string;
  thumbnail: string | null;
  description?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string;
  source: 'google-isbn' | 'google-title' | 'openlibrary' | 'cache';
}

interface CacheEntry {
  data: BookMetadata;
  timestamp: number;
  isbn: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// ============================================
// 1️⃣ ISBN NORMALIZATION (CRITICAL)
// ============================================

/**
 * Normalizes ISBN to standard format for API lookups
 * Handles ISBN-10, ISBN-13, with/without hyphens, with X suffix
 * 
 * @param raw - Raw ISBN string from barcode scanner or user input
 * @returns Normalized ISBN string (digits only, uppercase X preserved)
 * 
 * Examples:
 * - "978-0-13-468599-1" → "9780134685991"
 * - "0-306-40615-X" → "030640615X"
 * - "  978 0 13 468599 1  " → "9780134685991"
 */
export function normalizeISBN(raw: string): string {
  if (!raw) return '';

  // Step 1: Trim whitespace
  let normalized = raw.trim();

  // Step 2: Remove all non-alphanumeric characters (hyphens, spaces, etc.)
  normalized = normalized.replace(/[^0-9X]/gi, '');

  // Step 3: Convert to uppercase (for ISBN-10 with X)
  normalized = normalized.toUpperCase();

  // Step 4: Validate length (ISBN-10 = 10 digits, ISBN-13 = 13 digits)
  if (normalized.length !== 10 && normalized.length !== 13) {
    console.warn('⚠️ ISBN validation: Invalid length', { raw, normalized, length: normalized.length });
  }

  // Step 5: Validate X only appears at the end (ISBN-10 check digit)
  if (normalized.includes('X') && !normalized.endsWith('X')) {
    console.warn('⚠️ ISBN validation: X must be last character', { raw, normalized });
  }

  console.log('📖 ISBN normalized:', { raw, normalized });
  return normalized;
}

/**
 * Validates if a string is a potentially valid ISBN
 */
export function isValidISBN(isbn: string): boolean {
  const normalized = normalizeISBN(isbn);
  
  // Check length
  if (normalized.length !== 10 && normalized.length !== 13) {
    return false;
  }

  // Check format: digits only, or digits + X at end
  const isValidFormat = /^[0-9]{9}[0-9X]$/.test(normalized) || /^[0-9]{13}$/.test(normalized);
  
  return isValidFormat;
}

// ============================================
// 2️⃣ LOCAL CACHE LAYER
// ============================================

const CACHE_PREFIX = 'lexora_book_';
const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Retrieves cached book data from localStorage
 * 
 * @param isbn - Normalized ISBN
 * @param ttl - Time-to-live in milliseconds (default: 7 days, 0 = no expiry)
 * @returns Cached book data or null if not found/expired
 */
export function getCachedBook(isbn: string, ttl: number = DEFAULT_CACHE_TTL): BookMetadata | null {
  try {
    const cacheKey = `${CACHE_PREFIX}${isbn}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry = JSON.parse(cached);

    // Check TTL (0 = no expiry)
    if (ttl > 0) {
      const age = Date.now() - entry.timestamp;
      if (age > ttl) {
        console.log('🗑️ Cache expired:', { isbn, ageMinutes: Math.round(age / 60000) });
        localStorage.removeItem(cacheKey);
        return null;
      }
    }

    console.log('✅ Cache hit:', { isbn, source: entry.data.source, ageMinutes: Math.round((Date.now() - entry.timestamp) / 60000) });
    
    // Update source to indicate cache hit
    return {
      ...entry.data,
      source: 'cache'
    };
  } catch (error) {
    console.error('❌ Cache read error:', error);
    return null;
  }
}

/**
 * Stores book data in localStorage cache
 * 
 * @param isbn - Normalized ISBN
 * @param data - Book metadata to cache
 */
export function setCachedBook(isbn: string, data: BookMetadata): void {
  try {
    const cacheKey = `${CACHE_PREFIX}${isbn}`;
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      isbn
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log('💾 Cached book:', { isbn, title: data.title });
  } catch (error) {
    console.error('❌ Cache write error:', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Clears old cache entries (maintenance function)
 */
export function clearExpiredCache(ttl: number = DEFAULT_CACHE_TTL): number {
  let cleared = 0;
  
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (!key.startsWith(CACHE_PREFIX)) return;

      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;

        const entry: CacheEntry = JSON.parse(cached);
        const age = now - entry.timestamp;

        if (age > ttl) {
          localStorage.removeItem(key);
          cleared++;
        }
      } catch (err) {
        // Remove corrupted entries
        localStorage.removeItem(key);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired cache entries`);
    }
  } catch (error) {
    console.error('❌ Cache cleanup error:', error);
  }

  return cleared;
}

// ============================================
// 3️⃣ RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

/**
 * Fetches URL with automatic retry on network failures
 * Uses exponential backoff strategy
 * 
 * @param url - URL to fetch
 * @param config - Axios request configuration
 * @param retryConfig - Retry configuration
 * @returns Axios response
 */
export async function fetchWithRetry<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
  retryConfig: RetryConfig = {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 3000
  }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetch attempt ${attempt + 1}/${retryConfig.maxRetries + 1}:`, url);
      
      const response = await axios.get<T>(url, {
        timeout: 8000,
        ...config
      });

      if (attempt > 0) {
        console.log(`✅ Retry succeeded on attempt ${attempt + 1}`);
      }

      return response.data;
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (400-499) except 429 (rate limit)
      if (error.response) {
        const status = error.response.status;
        
        if (status === 404) {
          console.log('📭 404 Not Found - no retry needed');
          throw error; // Valid "not found" response
        }

        if (status >= 400 && status < 500 && status !== 429) {
          console.log(`⚠️ Client error ${status} - no retry`);
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(2, attempt),
        retryConfig.maxDelay
      );

      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
        error: error.message,
        status: error.response?.status
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('❌ All retry attempts failed');
  throw lastError || new Error('Fetch failed after retries');
}

// ============================================
// 4️⃣ SMART RESULT MATCHING & SCORING
// ============================================

/**
 * Calculates similarity score between two strings (0-1)
 * Uses simple word overlap algorithm
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  const words1 = new Set(normalize(title1).split(/\s+/));
  const words2 = new Set(normalize(title2).split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Scores a Google Books result based on ISBN match and data quality
 */
function scoreGoogleBooksResult(item: any, searchISBN: string): number {
  let score = 0;
  const volumeInfo = item.volumeInfo || {};

  // 1. ISBN exact match (highest priority) - 50 points
  const industryIdentifiers = volumeInfo.industryIdentifiers || [];
  const hasExactISBN = industryIdentifiers.some((id: any) => {
    const identifier = normalizeISBN(id.identifier || '');
    return identifier === searchISBN;
  });
  if (hasExactISBN) score += 50;

  // 2. Has thumbnail - 20 points
  if (volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail) {
    score += 20;
  }

  // 3. Has description - 10 points
  if (volumeInfo.description && volumeInfo.description.length > 50) {
    score += 10;
  }

  // 4. Has authors - 10 points
  if (volumeInfo.authors && volumeInfo.authors.length > 0) {
    score += 10;
  }

  // 5. Has publisher - 5 points
  if (volumeInfo.publisher) {
    score += 5;
  }

  // 6. Has publish date - 5 points
  if (volumeInfo.publishedDate) {
    score += 5;
  }

  return score;
}

/**
 * Selects the best result from Google Books API response
 */
export function selectBestGoogleBooksResult(items: any[], searchISBN: string, searchTitle?: string): any | null {
  if (!items || items.length === 0) {
    return null;
  }

  console.log(`🎯 Scoring ${items.length} Google Books results...`);

  // Score all results
  const scored = items.map(item => ({
    item,
    score: scoreGoogleBooksResult(item, searchISBN)
  }));

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Log top 3 scores
  scored.slice(0, 3).forEach((s, idx) => {
    console.log(`  ${idx + 1}. Score: ${s.score} - ${s.item.volumeInfo?.title || 'No title'}`);
  });

  const best = scored[0];
  console.log(`✅ Selected result with score: ${best.score}`);

  return best.item;
}

// ============================================
// 5️⃣ API FETCHERS WITH GRACEFUL ERROR HANDLING
// ============================================

/**
 * Fetches book data from Google Books API by ISBN
 */
async function fetchFromGoogleBooksISBN(isbn: string): Promise<BookMetadata | null> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const url = apiKey
      ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
      : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

    console.log('🔍 Searching Google Books by ISBN...');

    const data = await fetchWithRetry(url);

    if (!data.items || data.items.length === 0) {
      console.log('📭 Google Books: No results for ISBN');
      return null;
    }

    // Select best result using smart matching
    const bestResult = selectBestGoogleBooksResult(data.items, isbn);
    if (!bestResult) return null;

    const bookInfo = bestResult.volumeInfo || {};

    const result: BookMetadata = {
      title: bookInfo.title || 'Unknown Title',
      authors: bookInfo.authors?.join(', ') || 'Unknown Author',
      publisher: bookInfo.publisher || 'Unknown Publisher',
      publishedDate: bookInfo.publishedDate || '',
      thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || null,
      description: bookInfo.description || '',
      isbn: isbn,
      pageCount: bookInfo.pageCount || undefined,
      categories: bookInfo.categories?.join(', ') || '',
      source: 'google-isbn'
    };

    console.log('✅ Google Books ISBN found:', result.title);
    return result;
  } catch (error: any) {
    console.log('⚠️ Google Books ISBN failed:', error.message);
    return null;
  }
}

/**
 * Fetches book data from Google Books API by title (fallback)
 */
async function fetchFromGoogleBooksTitle(title: string): Promise<BookMetadata | null> {
  try {
    if (!title || title.length < 3) return null;

    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const encodedTitle = encodeURIComponent(title);
    const url = apiKey
      ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&key=${apiKey}&maxResults=5`
      : `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&maxResults=5`;

    console.log('🔍 Searching Google Books by title...');

    const data = await fetchWithRetry(url);

    if (!data.items || data.items.length === 0) {
      console.log('📭 Google Books: No results for title');
      return null;
    }

    const bookInfo = data.items[0].volumeInfo || {};

    const result: BookMetadata = {
      title: bookInfo.title || 'Unknown Title',
      authors: bookInfo.authors?.join(', ') || 'Unknown Author',
      publisher: bookInfo.publisher || 'Unknown Publisher',
      publishedDate: bookInfo.publishedDate || '',
      thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || null,
      description: bookInfo.description || '',
      pageCount: bookInfo.pageCount || undefined,
      categories: bookInfo.categories?.join(', ') || '',
      source: 'google-title'
    };

    console.log('✅ Google Books title found:', result.title);
    return result;
  } catch (error: any) {
    console.log('⚠️ Google Books title search failed:', error.message);
    return null;
  }
}

/**
 * Fetches book data from Open Library API
 */
async function fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

    console.log('🔍 Searching Open Library...');

    const data = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Lexora-Library/2.0 (Educational; Production)'
      }
    });

    const bookKey = `ISBN:${isbn}`;
    const bookData = data[bookKey];

    if (!bookData) {
      console.log('📭 Open Library: No results');
      return null;
    }

    const result: BookMetadata = {
      title: bookData.title || 'Unknown Title',
      authors: bookData.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author',
      publisher: bookData.publishers?.map((p: any) => p.name).join(', ') || 'Unknown Publisher',
      publishedDate: bookData.publish_date || '',
      thumbnail: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small || null,
      description: bookData.notes || '',
      isbn: isbn,
      pageCount: bookData.number_of_pages || undefined,
      categories: bookData.subjects?.slice(0, 3).map((s: any) => s.name).join(', ') || '',
      source: 'openlibrary'
    };

    console.log('✅ Open Library found:', result.title);
    return result;
  } catch (error: any) {
    console.log('⚠️ Open Library failed:', error.message);
    return null;
  }
}

// ============================================
// 6️⃣ MAIN PRODUCTION FETCH FUNCTION
// ============================================

let lastFetchTimestamp = 0;
const DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Production-level ISBN book lookup with multi-source fallback
 * 
 * Strategy:
 * 1. Check local cache
 * 2. Try Google Books (ISBN)
 * 3. Try Open Library
 * 4. Try Google Books (title fallback if we have partial data)
 * 5. Return null if all sources fail
 * 
 * @param rawISBN - Raw ISBN from scanner or input
 * @returns Book metadata or null if not found
 */
export async function fetchBookByISBN(rawISBN: string): Promise<BookMetadata | null> {
  // 7️⃣ Debounce protection (prevent duplicate rapid scans)
  const now = Date.now();
  if (now - lastFetchTimestamp < DEBOUNCE_DELAY) {
    console.log('⏸️ Debounced: Ignoring rapid scan');
    return null;
  }
  lastFetchTimestamp = now;

  // Step 1: Normalize ISBN
  const isbn = normalizeISBN(rawISBN);
  
  if (!isValidISBN(isbn)) {
    console.error('❌ Invalid ISBN format:', rawISBN);
    return null;
  }

  console.log('📖 Starting book lookup:', { raw: rawISBN, normalized: isbn });

  // Step 2: Check cache first
  const cached = getCachedBook(isbn);
  if (cached) {
    return cached;
  }

  // Step 3: Try Google Books (ISBN) - Primary source
  let result = await fetchFromGoogleBooksISBN(isbn);
  if (result) {
    setCachedBook(isbn, result);
    return result;
  }

  // Step 4: Try Open Library - Secondary source
  result = await fetchFromOpenLibrary(isbn);
  if (result) {
    setCachedBook(isbn, result);
    return result;
  }

  // Step 5: All sources failed
  console.log('❌ Book not found in any source:', isbn);
  return null;
}

// ============================================
// 7️⃣ UTILITY FUNCTIONS
// ============================================

/**
 * Clears all book cache (admin function)
 */
export function clearAllBookCache(): number {
  let cleared = 0;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    
    console.log(`🗑️ Cleared all book cache (${cleared} entries)`);
  } catch (error) {
    console.error('❌ Clear cache error:', error);
  }

  return cleared;
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { count: number; totalSizeKB: number; oldestEntry: Date | null } {
  let count = 0;
  let totalSize = 0;
  let oldestTimestamp = Date.now();

  try {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (!key.startsWith(CACHE_PREFIX)) return;
      
      const value = localStorage.getItem(key);
      if (!value) return;

      count++;
      totalSize += value.length;

      try {
        const entry: CacheEntry = JSON.parse(value);
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
        }
      } catch (err) {
        // Skip corrupted entries
      }
    });
  } catch (error) {
    console.error('❌ Cache stats error:', error);
  }

  return {
    count,
    totalSizeKB: Math.round(totalSize / 1024),
    oldestEntry: count > 0 ? new Date(oldestTimestamp) : null
  };
}

export default {
  fetchBookByISBN,
  normalizeISBN,
  isValidISBN,
  getCachedBook,
  setCachedBook,
  clearExpiredCache,
  clearAllBookCache,
  getCacheStats
};
