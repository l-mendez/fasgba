import * as XLSX from 'xlsx-js-style';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExcelPlayer {
  __EMPTY: number;
  ID: string;
  TIT: string;
  Nombre: string;
  'Ranking Nuevo': number;
  Club?: string;
  Categoría?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';
    
    const filePath = path.join(process.cwd(), 'public/data/ranking.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Excel file not found' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet);

    // Transform the data to match our Player interface
    const transformedData = rawData.map(player => ({
      id: player.__EMPTY,
      nombre: player.Nombre,
      club: player.Club || '',
      elo: player['Ranking Nuevo'],
      categoria: player.Categoría || 'Absoluto',
      titulo: player.TIT || '',
      edad: 0 // We'll need to calculate this if needed
    }));

    // Filter by search term if provided
    const filteredData = search
      ? transformedData.filter(player => 
          player.nombre.toLowerCase().includes(search.toLowerCase()) ||
          player.club.toLowerCase().includes(search.toLowerCase())
        )
      : transformedData;

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return NextResponse.json({
      players: paginatedData,
      total: filteredData.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredData.length / pageSize)
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
} 