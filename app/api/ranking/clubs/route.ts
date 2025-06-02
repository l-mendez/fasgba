import { NextResponse } from 'next/server';
import { getClubs } from '@/lib/rankingUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const clubs = await getClubs();
    
    return NextResponse.json({
      clubs,
      total: clubs.length
    });
    
  } catch (error) {
    console.error('Error getting clubs:', error);
    return NextResponse.json(
      { error: 'Failed to load clubs' },
      { status: 500 }
    );
  }
} 