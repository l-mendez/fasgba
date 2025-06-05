-- Check current column structure
\d auth.users;

-- View all users with their current metadata (try both column names)
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- View specific user metadata by email (using raw_user_meta_data)
SELECT 
    id,
    email,
    raw_user_meta_data->'nombre' as nombre,
    raw_user_meta_data->'apellido' as apellido,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'amendez@solucionesbancarias.com.ar';

-- Update user metadata using raw_user_meta_data (this should work)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{nombre}', 
        '"Alejandro"'
    ),
    '{apellido}', 
    '"Mendez"'
)
WHERE email = 'amendez@solucionesbancarias.com.ar';

-- Verify the update using raw_user_meta_data
SELECT 
    email,
    raw_user_meta_data->'nombre' as nombre,
    raw_user_meta_data->'apellido' as apellido,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'amendez@solucionesbancarias.com.ar';

-- Alternative: Try using the Supabase auth admin API method
-- This uses Supabase's updateUserById function which might map to user_metadata correctly 