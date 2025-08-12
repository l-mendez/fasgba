import { NextResponse } from 'next/server';
import { getPlayers, type PaginatedPlayersResponse } from '@/lib/rankingUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';
    const activeParamRaw = (searchParams.get('active') || 'all').toLowerCase();
    const activeFilter: 'active' | 'inactive' | 'all' =
      activeParamRaw === 'inactive' ? 'inactive' : activeParamRaw === 'active' ? 'active' : 'all';
    
    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get players from Supabase Storage
    const data: PaginatedPlayersResponse = await getPlayers(page, pageSize, search, undefined, activeFilter);

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in /api/data route:', error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unable to get public URL')) {
        return NextResponse.json(
          { error: 'Ranking data not found in storage' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Failed to fetch ranking data')) {
        return NextResponse.json(
          { error: 'Unable to fetch ranking data' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to load ranking data' },
      { status: 500 }
    );
  }
} 