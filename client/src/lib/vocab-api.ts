import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_DEV_URL;
const anonKey = import.meta.env.VITE_SUPABASE_DEV_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, anonKey);

export interface VocabEntry {
  id: string;
  kanji: string | null;
  hiragana: string;
  english_meaning: string;
  jlpt_level: number;
  word_type: string | null;
  source_id: string | null;
  created_at: string;
}

export interface VocabFilters {
  jlpt_level?: number | number[];
  word_type?: string;
  source_id?: string;
  search?: string; // For kanji/hiragana partial search
}

export interface VocabQueryOptions {
  filters?: VocabFilters;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Fetches vocabulary entries with pagination and filtering support
 */
export async function fetchVocabulary(options: VocabQueryOptions = {}): Promise<{
  data: VocabEntry[];
  count: number;
  error: any;
}> {
  try {
    let query = supabase
      .from('vocab_library')
      .select('*', { count: 'exact' });

    // Apply filters
    if (options.filters) {
      const { jlpt_level, word_type, source_id, search } = options.filters;

      if (jlpt_level !== undefined) {
        if (Array.isArray(jlpt_level)) {
          query = query.in('jlpt_level', jlpt_level);
        } else {
          query = query.eq('jlpt_level', jlpt_level);
        }
      }

      if (word_type) {
        query = query.eq('word_type', word_type);
      }

      if (source_id) {
        query = query.eq('source_id', source_id);
      }

      if (search) {
        query = query.or(`kanji.ilike.%${search}%,hiragana.ilike.%${search}%`);
      }
    }

    // Apply ordering
    const orderBy = options.orderBy || 'jlpt_level';
    const orderDirection = options.orderDirection || 'asc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const limit = options.limit || 1000;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    return {
      data: data || [],
      count: count || 0,
      error
    };
  } catch (error) {
    return {
      data: [],
      count: 0,
      error
    };
  }
}

/**
 * Fetches all vocabulary entries using chunked pagination
 */
export async function fetchAllVocabulary(filters?: VocabFilters): Promise<{
  data: VocabEntry[];
  count: number;
  error: any;
}> {
  try {
    const allData: VocabEntry[] = [];
    let start = 0;
    const chunkSize = 1000;

    while (true) {
      const result = await fetchVocabulary({
        filters,
        limit: chunkSize,
        offset: start
      });

      if (result.error) {
        console.error('Error fetching vocabulary chunk:', result.error);
        return { data: [], count: 0, error: result.error };
      }

      if (!result.data || result.data.length === 0) {
        break;
      }

      allData.push(...result.data);

      if (result.data.length < chunkSize) {
        break;
      }

      start += chunkSize;

      // Safety break to prevent infinite loops
      if (start > 50000) {
        console.warn('Safety break at 50k records');
        break;
      }
    }

    return {
      data: allData,
      count: allData.length,
      error: null
    };
  } catch (error) {
    return {
      data: [],
      count: 0,
      error
    };
  }
}

/**
 * Fetches vocabulary statistics by JLPT level
 */
export async function fetchVocabStats(): Promise<{
  data: Array<{ level: string; count: number; color: string }>;
  totalCount: number;
  error: any;
}> {
  try {
    const { data, error } = await fetchAllVocabulary();

    if (error) {
      return { data: [], totalCount: 0, error };
    }

    const levelCounts: Record<string, number> = {};
    
    data.forEach(item => {
      const level = `N${item.jlpt_level}`;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const levelColors: Record<string, string> = {
      'N5': '#22c55e', // Green
      'N4': '#3b82f6', // Blue
      'N3': '#f59e0b', // Yellow
      'N2': '#f97316', // Orange
      'N1': '#ef4444'  // Red
    };

    const statsData = Object.entries(levelCounts)
      .map(([level, count]) => ({
        level,
        count,
        color: levelColors[level] || '#6b7280'
      }))
      .sort((a, b) => Number(b.level.slice(1)) - Number(a.level.slice(1)));

    return {
      data: statsData,
      totalCount: data.length,
      error: null
    };
  } catch (error) {
    return {
      data: [],
      totalCount: 0,
      error
    };
  }
}

/**
 * Fetches vocabulary by specific JLPT levels
 */
export async function fetchVocabByLevels(levels: number[]): Promise<{
  data: VocabEntry[];
  error: any;
}> {
  return fetchAllVocabulary({ jlpt_level: levels });
}

/**
 * Searches vocabulary with text input
 */
export async function searchVocabulary(searchTerm: string, options: VocabQueryOptions = {}): Promise<{
  data: VocabEntry[];
  count: number;
  error: any;
}> {
  const filters = {
    ...options.filters,
    search: searchTerm
  };

  return fetchVocabulary({
    ...options,
    filters
  });
}