-- Fix image URLs from absolute to relative paths
UPDATE listings 
SET images = (
  SELECT array_agg(
    CASE 
      WHEN img LIKE 'http://localhost:5000/uploads/%' THEN REPLACE(img, 'http://localhost:5000', '')
      WHEN img LIKE 'http://127.0.0.1:5000/uploads/%' THEN REPLACE(img, 'http://127.0.0.1:5000', '')
      WHEN img LIKE 'https://localhost:5000/uploads/%' THEN REPLACE(img, 'https://localhost:5000', '')
      ELSE img
    END
  )
  FROM unnest(images) AS img
)
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- Verify the fix
SELECT id, title, images FROM listings 
WHERE images IS NOT NULL AND array_length(images, 1) > 0 
LIMIT 5;
