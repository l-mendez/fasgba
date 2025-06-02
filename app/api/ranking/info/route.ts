import { NextResponse } from 'next/server';
import { getLastUpdated, fetchRankingData } from '@/lib/rankingUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [lastUpdated, rankingData] = await Promise.all([
      getLastUpdated(),
      fetchRankingData()
    ]);
    
    return NextResponse.json({
      lastUpdated,
      totalPlayers: rankingData.totalPlayers,
      dataSource: 'supabase-storage'
    });
    
  } catch (error) {
    console.error('Error getting ranking info:', error);
    return NextResponse.json(
      { error: 'Failed to load ranking information' },
      { status: 500 }
    );
  }
} 