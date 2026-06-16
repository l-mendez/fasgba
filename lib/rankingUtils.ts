import { createClient } from "@/lib/supabase/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePlayer } from "@/lib/rankingDisplay"

// Re-exported for existing consumers that import it from this module.
export { normalizePlayer }

export type RatingType = 'standard' | 'rapid' | 'blitz';

export interface PlayerRatings {
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
}

export interface PlayerPositions {
  standard: number;
  rapid: number;
  blitz: number;
}

export interface TournamentDetail {
  periodo: string;
  playerId: string;
  playerName: string;
  club: string;
  eloBefore: number;
  wins: number;
  games: number;
  expectedScore: number;
  scoreDiff: number;
  avgOpponentRating: number;
  performanceRating: number;
  kFactor: number;
  eloChange: number;
  type: RatingType;
  tournament: string;
}

export interface AnalyticsData {
  filename: string;
  rankingFilename: string;
  month: number;
  year: number;
  details: TournamentDetail[];
}

export interface Player {
  position: number;
  id?: string;
  name: string;
  title?: string;
  club: string;
  category?: string;
  points: number;
  matches: number;
  ratings: PlayerRatings;
  positions?: PlayerPositions;
  changes?: {
    position: number | null;
    points: number;
    ratings?: { standard: number; rapid: number; blitz: number };
    isNew: boolean;
  };
  active: boolean;
}

export interface RankingData {
  version?: number;
  filename: string;
  lastUpdated: string;
  totalPlayers: number;
  month: number;
  year: number;
  previousRanking: string | null;
  players: Player[];
  analyticsFilename?: string;
}

export interface PaginatedPlayersResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Normalizes all players in a RankingData object
 */
function normalizeRankingData(data: any): RankingData {
  return {
    ...data,
    players: (data.players || []).map(normalizePlayer),
  };
}

/**
 * Normalized name for legacy comparisons when no ID is available.
 */
export function normalizePlayerNameForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Finds the matching previous-ranking player for a current player.
 * Matches strictly by ID first. Falls back to name only against legacy records
 * that don't have an ID — never cross-matches by name when both sides have IDs,
 * since IDs that don't match mean different players.
 */
export function findPreviousPlayer<T extends { id?: string; name: string }>(
  player: { id?: string; name: string },
  previousPlayers: T[]
): T | undefined {
  if (player.id) {
    const byId = previousPlayers.find(p => p.id && p.id === player.id);
    if (byId) return byId;
  }
  const target = normalizePlayerNameForMatch(player.name);
  return previousPlayers.find(p => !p.id && normalizePlayerNameForMatch(p.name) === target);
}

/**
 * Maps a numeric tipo value to a RatingType string
 */
export function mapTipoToRatingType(tipo: number): RatingType {
  switch (tipo) {
    case 1: return 'standard';
    case 2: return 'rapid';
    case 3: return 'blitz';
    default: return 'standard';
  }
}

/**
 * Returns the display label for a rating type (Spanish)
 */
export function getRatingTypeLabel(type: RatingType): string {
  switch (type) {
    case 'standard': return 'Standard';
    case 'rapid': return 'Rápido';
    case 'blitz': return 'Blitz';
  }
}

/**
 * Computes positions for each rating type by sorting players
 */
export function computePositionsByRatingType(players: Player[]): Player[] {
  const ratingTypes: RatingType[] = ['standard', 'rapid', 'blitz'];

  // Initialize positions maps
  const positionMaps: Record<RatingType, Map<string, number>> = {
    standard: new Map(),
    rapid: new Map(),
    blitz: new Map(),
  };

  for (const type of ratingTypes) {
    const sorted = [...players]
      .filter(p => p.ratings[type] !== null && p.ratings[type] !== 0)
      .sort((a, b) => (b.ratings[type] || 0) - (a.ratings[type] || 0));

    sorted.forEach((player, index) => {
      const key = player.id || player.name;
      positionMaps[type].set(key, index + 1);
    });
  }

  return players.map(player => {
    const key = player.id || player.name;
    return {
      ...player,
      positions: {
        standard: positionMaps.standard.get(key) || 0,
        rapid: positionMaps.rapid.get(key) || 0,
        blitz: positionMaps.blitz.get(key) || 0,
      },
    };
  });
}

/**
 * Regex pattern for ranking files - excludes analytics files
 */
const RANKING_FILE_PATTERN = /^ranking-\d{2}-\d{4}(?:\s*\(\d+\))?\.json$/;

// Cache for ranking data to avoid repeated fetches
let rankingCache: RankingData | null = null;
let cacheTimestamp: number = 0;
let cachedLatestFilename: string | null = null; // Track which file is cached
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Checks if the cached data is stale by comparing with latest available ranking
 */
async function isCacheStale(): Promise<boolean> {
  if (!rankingCache || !cachedLatestFilename) {
    return true; // No cache, definitely stale
  }

  try {
    // Get available rankings to check if there's a newer one
    const adminSupabase = createAdminClient();
    const { data: files, error: listError } = await adminSupabase.storage
      .from('ranking-data')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError || !files) {
      return false; // Can't check, assume cache is still valid
    }

    // Find the chronologically latest ranking file
    const rankingFiles = files
      .filter(file => 
        file.name.endsWith('.json') &&
        !file.name.startsWith('temp/') &&
        !file.name.includes('-analytics') &&
        file.name.match(/^ranking-\d{2}-\d{4}/)
      )
      .map(file => {
        const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
        if (!match) return null
        
        const month = parseInt(match[1])
        const year = parseInt(match[2])
        
        return {
          filename: file.name,
          month,
          year,
          date: new Date(year, month - 1),
          created_at: file.created_at
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dateComparison = (b?.date.getTime() || 0) - (a?.date.getTime() || 0);
        if (dateComparison !== 0) return dateComparison;
        return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
      });

    if (rankingFiles.length === 0) {
      return false; // No files found, keep cache
    }

    const latestFile = rankingFiles[0];
    return latestFile?.filename !== cachedLatestFilename; // Cache is stale if latest file changed
  } catch (error) {
    console.warn('Error checking cache staleness:', error);
    return false; // Error checking, assume cache is still valid
  }
}

/**
 * Fetches the latest ranking data - uses admin client on server, API on client
 */
export async function fetchRankingData(): Promise<RankingData> {
  // Check if we have valid cached data and it's not stale
  const now = Date.now();
  const isTimeExpired = !rankingCache || (now - cacheTimestamp) >= CACHE_DURATION;
  const isDataStale = await isCacheStale();
  
  if (rankingCache && !isTimeExpired && !isDataStale) {
    return rankingCache;
  }

  try {    
    // Try to use admin client directly (server-side)
    let data: RankingData;
    
    try {
      const adminSupabase = createAdminClient();
      
      // List all ranking files to find the chronologically latest one
      const { data: files, error: listError } = await adminSupabase.storage
        .from('ranking-data')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError || !files) {
        throw new Error(`Failed to list ranking files: ${listError?.message || 'Unknown error'}`);
      }

      // Filter and find the chronologically latest ranking file (by date in filename, not upload time)
      const rankingFiles = files
        .filter(file => 
          file.name.endsWith('.json') && 
          !file.name.startsWith('temp/') &&
          file.name.match(/^ranking-\d{2}-\d{4}/)
        )
        .map(file => {
          const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
          if (!match) return null
          
          const month = parseInt(match[1])
          const year = parseInt(match[2])
          
          return {
            filename: file.name,
            month,
            year,
            date: new Date(year, month - 1), // month - 1 because Date months are 0-indexed
            created_at: file.created_at
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          // First sort by chronological date (most recent first)
          const dateComparison = (b?.date.getTime() || 0) - (a?.date.getTime() || 0);
          if (dateComparison !== 0) return dateComparison;
          
          // For same month/year, sort by creation time (most recent first)
          // This ensures higher numbered versions (created later) come first
          return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
        }); // Sort by chronological date, most recent first

      if (rankingFiles.length === 0) {
        throw new Error('No ranking files found');
      }

      const latestFile = rankingFiles[0];
      if (!latestFile) {
        throw new Error('No valid ranking files found');
      }
      // Download the latest ranking file
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(latestFile.filename);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download ranking file: ${downloadError?.message || 'Unknown error'}`);
      }

      const jsonContent = await fileData.text();
      data = JSON.parse(jsonContent);
      
      // Update cached filename
      cachedLatestFilename = latestFile.filename;
      
    } catch (serverError) {      
      // Fallback to API endpoint (client-side or when admin client fails)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ranking/latest`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ranking data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ranking data');
      }

      data = result.data;
      
      // Update cached filename for API response
      cachedLatestFilename = data.filename;
    }
    
    // Validate data structure
    if (!data.players || !Array.isArray(data.players)) {
      throw new Error('Invalid ranking data structure');
    }

    // Normalize players to new format (backward compat)
    data = normalizeRankingData(data);

    // Update cache
    rankingCache = data;
    cacheTimestamp = now;
    return data;

  } catch (error) {
    console.error('Error fetching ranking data:', error);
    throw error;
  }
}

/**
 * Fetches a specific ranking by filename
 */
export async function fetchSpecificRankingData(filename: string): Promise<RankingData> {
  try {    
    // Try to use admin client directly (server-side)
    try {
      const adminSupabase = createAdminClient();
      
      // Add .json extension if not present
      const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
      
      // Download the specific ranking file
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(fullFilename);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download ranking file: ${downloadError?.message || 'Unknown error'}`);
      }

      const jsonContent = await fileData.text();
      const data = JSON.parse(jsonContent);
      
      // Validate data structure
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('Invalid ranking data structure');
      }
      return normalizeRankingData(data);

    } catch (serverError) {
      // Fallback to API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ranking/specific?filename=${encodeURIComponent(filename)}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ranking data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ranking data');
      }

      return normalizeRankingData(result.data);
    }

  } catch (error) {
    console.error('Error fetching specific ranking data:', error);
    throw error;
  }
}

/**
 * Gets a list of available rankings for the dropdown
 */
export async function getAvailableRankings(): Promise<Array<{filename: string, displayName: string, month: number, year: number, date: Date}>> {
  try {    
    // Try to use admin client directly (server-side)
    try {
      const adminSupabase = createAdminClient();
      
      // List all ranking files
      const { data: files, error: listError } = await adminSupabase.storage
        .from('ranking-data')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError || !files) {
        throw new Error(`Failed to list ranking files: ${listError?.message || 'Unknown error'}`);
      }

      // Filter and process ranking files
      const rankingFiles = files
        .filter(file => 
          file.name.endsWith('.json') && 
          !file.name.startsWith('temp/') &&
          file.name.match(/^ranking-\d{2}-\d{4}/)
        )
        .map(file => {
          const match = file.name.match(/^ranking-(\d{2})-(\d{4}).*\.json$/)
          if (!match) return null
          
          const month = parseInt(match[1])
          const year = parseInt(match[2])
          const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ]
          
          return {
            filename: file.name.replace('.json', ''),
            month,
            year,
            date: new Date(year, month - 1),
            created_at: file.created_at,
            baseDisplayName: `${monthNames[month - 1]} ${year}`
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          // First sort by chronological date (most recent first)
          const dateComparison = (b?.date.getTime() || 0) - (a?.date.getTime() || 0);
          if (dateComparison !== 0) return dateComparison;
          
          // For same month/year, sort by creation time (most recent first)
          // This ensures higher numbered versions (created later) come first
          return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
        });

      // Handle duplicate months by adding (2), (3), etc. based on creation order
      const monthYearGroups = new Map<string, any[]>();
      
      // Group rankings by month/year
      rankingFiles.forEach(ranking => {
        if (!ranking) return;
        const monthYearKey = `${ranking.month}-${ranking.year}`;
        if (!monthYearGroups.has(monthYearKey)) {
          monthYearGroups.set(monthYearKey, []);
        }
        monthYearGroups.get(monthYearKey)!.push(ranking);
      });
      
      // Process each group to assign correct display names
      const processedRankings = rankingFiles.map(ranking => {
        if (!ranking) return null;
        const monthYearKey = `${ranking.month}-${ranking.year}`;
        const sameMonthRankings = monthYearGroups.get(monthYearKey)!;
        
        if (sameMonthRankings.length === 1) {
          // Only one ranking for this month/year
          return {
            filename: ranking.filename,
            displayName: ranking.baseDisplayName,
            month: ranking.month,
            year: ranking.year,
            date: ranking.date
          };
        }
        
        // Multiple rankings for same month/year - sort by creation time (oldest first)
        const sortedSameMonth = [...sameMonthRankings].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Find the position of current ranking in creation order
        const positionInCreationOrder = sortedSameMonth.findIndex(r => r.filename === ranking.filename);
        
        const displayName = positionInCreationOrder === 0 
          ? ranking.baseDisplayName 
          : `${ranking.baseDisplayName} (${positionInCreationOrder + 1})`;
        
        return {
          filename: ranking.filename,
          displayName,
          month: ranking.month,
          year: ranking.year,
          date: ranking.date
        };
      }).filter((ranking): ranking is { filename: string; displayName: string; month: number; year: number; date: Date } => ranking !== null);

      return processedRankings;
      
    } catch (serverError) {      
      // Fallback to API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ranking/list`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rankings list: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch rankings list');
      }

      return result.data;
    }

  } catch (error) {
    console.error('Error fetching available rankings:', error);
    throw error;
  }
}

/**
 * Gets a specific player by position
 */
export async function getPlayerByPosition(position: number): Promise<Player | null> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.players.find(player => player.position === position) || null;
  } catch (error) {
    console.error('Error getting player by position:', error);
    throw error;
  }
}

/**
 * Gets players by club
 */
export async function getPlayersByClub(clubName: string): Promise<Player[]> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.players.filter(player => 
      player.club.toLowerCase().includes(clubName.toLowerCase())
    );
  } catch (error) {
    console.error('Error getting players by club:', error);
    throw error;
  }
}

/**
 * Updates the ranking data in Supabase Storage (admin only)
 */
export async function updateRankingData(newData: RankingData): Promise<void> {
  if (!createAdminClient()) {
    throw new Error('Admin access required to update ranking data');
  }

  try {    
    // Add timestamp
    const dataWithTimestamp = {
      ...newData,
      lastUpdated: new Date().toISOString()
    };

    // Convert to JSON buffer
    const jsonBuffer = Buffer.from(JSON.stringify(dataWithTimestamp, null, 2));
    
    // Upload to Supabase Storage with the proper filename
    const filename = `${newData.filename}.json`;
    const { error } = await createAdminClient().storage
      .from('ranking-data')
      .upload(filename, jsonBuffer, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to update ranking data: ${error.message}`);
    }

    // Clear cache to force refresh
    rankingCache = null;
    cacheTimestamp = 0;
    cachedLatestFilename = null;

  } catch (error) {
    console.error('Error updating ranking data:', error);
    throw error;
  }
}

/**
 * Clears the ranking data cache
 */
export function clearRankingCache(): void {
  rankingCache = null;
  cacheTimestamp = 0;
  cachedLatestFilename = null;
}

/**
 * Forces cache invalidation after ranking modifications
 * Call this after any ranking updates that might affect chronological order
 */
export function forceRankingCacheInvalidation(): void {
  rankingCache = null;
  cacheTimestamp = 0;
  cachedLatestFilename = null;
}

/**
 * Fetches analytics data for a specific ranking
 */
export async function fetchAnalyticsData(rankingFilename: string): Promise<AnalyticsData | null> {
  try {
    const baseName = rankingFilename.replace('.json', '');
    const analyticsFilename = `${baseName}-analytics.json`;

    try {
      const adminSupabase = createAdminClient();
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(analyticsFilename);

      if (downloadError || !fileData) {
        return null;
      }

      const jsonContent = await fileData.text();
      return JSON.parse(jsonContent);
    } catch {
      // Fallback to API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ranking/analytics?ranking=${encodeURIComponent(baseName)}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}

/**
 * Gets tournament details for a specific player
 */
export async function getPlayerAnalytics(rankingFilename: string, playerId: string): Promise<TournamentDetail[]> {
  const analytics = await fetchAnalyticsData(rankingFilename);
  if (!analytics) return [];
  return analytics.details.filter(d => d.playerId === playerId);
}