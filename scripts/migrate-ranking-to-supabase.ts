import dotenv from 'dotenv';

// Load environment variables from .env.local FIRST
dotenv.config({ path: '.env.local' });

import * as XLSX from 'xlsx-js-style';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

interface ExcelPlayer {
  __EMPTY: number;
  ID: string;
  TIT: string;
  Nombre: string;
  'Ranking Nuevo': number;
  Club?: string;
  Categoría?: string;
}

interface Player {
  id: number;
  nombre: string;
  club: string;
  elo: number;
  categoria: string;
  titulo: string;
  edad: number;
}

async function migrateRankingToSupabase() {
  try {
    console.log('Loading environment variables...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
      throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
    }

    console.log('Creating Supabase admin client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting ranking migration to Supabase...');

    // Read the Excel file
    const filePath = path.join(process.cwd(), 'public/data/ranking.xlsx');
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Excel file not found at: ' + filePath);
    }

    console.log('Reading Excel file...');
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<ExcelPlayer>(sheet);

    // Transform the data to match our Player interface
    console.log('Transforming data...');
    const transformedData: Player[] = rawData.map(player => ({
      id: player.__EMPTY,
      nombre: player.Nombre,
      club: player.Club || '',
      elo: player['Ranking Nuevo'],
      categoria: player.Categoría || 'Absoluto',
      titulo: player.TIT || '',
      edad: 0 // We'll need to calculate this if needed
    }));

    console.log(`Processed ${transformedData.length} players`);

    // Create JSON file
    const jsonData = {
      lastUpdated: new Date().toISOString(),
      totalPlayers: transformedData.length,
      players: transformedData
    };

    // Create temp file
    const tempFilePath = path.join(process.cwd(), 'temp-ranking.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2));
    console.log('Created temporary JSON file');

    // Create bucket if it doesn't exist
    console.log('Checking/creating storage bucket...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error('Failed to list buckets: ' + bucketsError.message);
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'ranking-data');
    
    if (!bucketExists) {
      console.log('Creating ranking-data bucket...');
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('ranking-data', {
        public: true,
        allowedMimeTypes: ['application/json'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
      });

      if (createBucketError) {
        throw new Error('Failed to create bucket: ' + createBucketError.message);
      }
    }

    // Upload JSON file to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const jsonBuffer = fs.readFileSync(tempFilePath);
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ranking-data')
      .upload('ranking.json', jsonBuffer, {
        contentType: 'application/json',
        upsert: true // This will overwrite if file exists
      });

    if (uploadError) {
      throw new Error('Failed to upload file: ' + uploadError.message);
    }

    console.log('Successfully uploaded ranking data to Supabase Storage!');
    console.log('Upload data:', uploadData);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    console.log('Cleaned up temporary files');

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('ranking-data')
      .getPublicUrl('ranking.json');

    console.log('Public URL for ranking data:', urlData.publicUrl);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    
    // Clean up temp file if it exists
    const tempFilePath = path.join(process.cwd(), 'temp-ranking.json');
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateRankingToSupabase();
}

export { migrateRankingToSupabase }; 