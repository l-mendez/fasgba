import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/rankingUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await getCategories();
    
    return NextResponse.json({
      categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to load categories' },
      { status: 500 }
    );
  }
} 