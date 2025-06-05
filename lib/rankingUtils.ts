import { createClient } from "@/lib/supabase/client"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Player {
  position: number;
  name: string;
  club: string;
  points: number;
  matches: number;
  changes?: {
    position: number | null; // positive = moved up, negative = moved down, null = new player
    points: number; // positive = gained points, negative = lost points
    isNew: boolean; // true if player wasn't in previous ranking
  };
}

export interface RankingData {
  filename: string;
  lastUpdated: string;
  totalPlayers: number;
  month: number;
  year: number;
  previousRanking: string | null;
  players: Player[];
}

export interface PaginatedPlayersResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cache for ranking data to avoid repeated fetches
let rankingCache: RankingData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches the latest ranking data - uses admin client on server, API on client
 */
export async function fetchRankingData(): Promise<RankingData> {
  // Check if we have valid cached data
  const now = Date.now();
  if (rankingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return rankingCache;
  }

  try {
    console.log('Fetching latest ranking data...');
    
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
      console.log(`Found chronologically latest ranking: ${latestFile.filename} (${latestFile.month}/${latestFile.year})`);

      // Download the latest ranking file
      const { data: fileData, error: downloadError } = await adminSupabase.storage
        .from('ranking-data')
        .download(latestFile.filename);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download ranking file: ${downloadError?.message || 'Unknown error'}`);
      }

      const jsonContent = await fileData.text();
      data = JSON.parse(jsonContent);
      
    } catch (serverError) {
      console.log('Server-side access failed, trying API endpoint...', serverError);
      
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
    }
    
    // Validate data structure
    if (!data.players || !Array.isArray(data.players)) {
      throw new Error('Invalid ranking data structure');
    }

    // Update cache
    rankingCache = data;
    cacheTimestamp = now;

    console.log(`Loaded ${data.totalPlayers} players from latest ranking: ${data.filename}`);
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
    console.log(`Fetching specific ranking data: ${filename}`);
    
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

      console.log(`Loaded ${data.totalPlayers} players from ranking: ${data.filename}`);
      return data;
      
    } catch (serverError) {
      console.log('Server-side access failed, trying API endpoint...', serverError);
      
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

      return result.data;
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
    console.log('Fetching available rankings...');
    
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
      console.log('Server-side access failed, trying API endpoint...', serverError);
      
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
 * Gets paginated and filtered players data
 */
export async function getPlayers(
  page: number = 1,
  pageSize: number = 50,
  search: string = '',
  rankingFilename?: string
): Promise<PaginatedPlayersResponse> {
  try {
    const rankingData = rankingFilename 
      ? await fetchSpecificRankingData(rankingFilename)
      : await fetchRankingData();
    
    // Filter by search term if provided
    const filteredPlayers = search
      ? rankingData.players.filter(player => 
          player.name.toLowerCase().includes(search.toLowerCase()) ||
          player.club.toLowerCase().includes(search.toLowerCase())
        )
      : rankingData.players;

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

    return {
      players: paginatedPlayers,
      total: filteredPlayers.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredPlayers.length / pageSize)
    };

  } catch (error) {
    console.error('Error getting players:', error);
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
 * Gets unique clubs from the ranking data
 */
export async function getClubs(): Promise<string[]> {
  try {
    const rankingData = await fetchRankingData();
    const clubs = [...new Set(rankingData.players.map(player => player.club))]
      .filter(club => club && club.trim() !== '');
    
    return clubs.sort();
  } catch (error) {
    console.error('Error getting clubs:', error);
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
    console.log('Updating ranking data in Supabase Storage...');
    
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

    console.log('Ranking data updated successfully');

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
}

/**
 * Forces a cache refresh by clearing cache and fetching fresh data
 */
export async function refreshRankingData(): Promise<void> {
  clearRankingCache();
  // Trigger a fresh fetch
  try {
    await fetchRankingData();
  } catch (error) {
    console.warn('Error refreshing ranking data:', error);
  }
}

/**
 * Gets the last updated timestamp from the ranking data
 */
export async function getLastUpdated(): Promise<string | null> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.lastUpdated || null;
  } catch (error) {
    console.error('Error getting last updated timestamp:', error);
    return null;
  }
}

/**
 * Gets players with recent changes (moved up/down positions or new players)
 */
export async function getPlayersWithChanges(): Promise<Player[]> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.players.filter(player => 
      player.changes && (player.changes.isNew || player.changes.position !== 0)
    );
  } catch (error) {
    console.error('Error getting players with changes:', error);
    throw error;
  }
} 