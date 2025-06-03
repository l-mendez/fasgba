import { createClient } from "@/lib/supabase/client"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Player {
  id: number;
  nombre: string;
  club: string;
  elo: number;
  categoria: string;
  titulo: string;
  edad: number;
}

export interface RankingData {
  lastUpdated: string;
  totalPlayers: number;
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
 * Fetches ranking data from Supabase Storage
 */
export async function fetchRankingData(): Promise<RankingData> {
  // Check if we have valid cached data
  const now = Date.now();
  if (rankingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return rankingCache;
  }

  try {
    console.log('Fetching ranking data from Supabase Storage...');
    
    // Get the public URL for the ranking file
    const { data: urlData } = createClient().storage
      .from('ranking-data')
      .getPublicUrl('ranking.json');

    if (!urlData?.publicUrl) {
      throw new Error('Unable to get public URL for ranking data');
    }

    // Fetch the JSON data
    const response = await fetch(urlData.publicUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ranking data: ${response.status} ${response.statusText}`);
    }

    const data: RankingData = await response.json();
    
    // Validate data structure
    if (!data.players || !Array.isArray(data.players)) {
      throw new Error('Invalid ranking data structure');
    }

    // Update cache
    rankingCache = data;
    cacheTimestamp = now;

    console.log(`Loaded ${data.totalPlayers} players from Supabase Storage`);
    return data;

  } catch (error) {
    console.error('Error fetching ranking data:', error);
    throw error;
  }
}

/**
 * Gets paginated and filtered players data
 */
export async function getPlayers(
  page: number = 1,
  pageSize: number = 50,
  search: string = ''
): Promise<PaginatedPlayersResponse> {
  try {
    const rankingData = await fetchRankingData();
    
    // Filter by search term if provided
    const filteredPlayers = search
      ? rankingData.players.filter(player => 
          player.nombre.toLowerCase().includes(search.toLowerCase()) ||
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
 * Gets a specific player by ID
 */
export async function getPlayerById(id: number): Promise<Player | null> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.players.find(player => player.id === id) || null;
  } catch (error) {
    console.error('Error getting player by ID:', error);
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
 * Gets players by category
 */
export async function getPlayersByCategory(category: string): Promise<Player[]> {
  try {
    const rankingData = await fetchRankingData();
    return rankingData.players.filter(player => 
      player.categoria.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting players by category:', error);
    throw error;
  }
}

/**
 * Gets unique categories from the ranking data
 */
export async function getCategories(): Promise<string[]> {
  try {
    const rankingData = await fetchRankingData();
    const categories = [...new Set(rankingData.players.map(player => player.categoria))]
      .filter(category => category && category.trim() !== '');
    
    return categories.sort();
  } catch (error) {
    console.error('Error getting categories:', error);
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
    
    // Upload to Supabase Storage
    const { error } = createAdminClient().storage
      .from('ranking-data')
      .upload('ranking.json', jsonBuffer, {
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