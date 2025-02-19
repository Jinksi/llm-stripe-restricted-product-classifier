-- SQLite
-- Show all results in descending order of creation date
SELECT
    r.*,
    p.name as product_name,
    s.url as site_url
FROM results r
JOIN products p ON r.product_id = p.id
JOIN sites s ON p.site_id = s.id
-- WHERE s.url LIKE '%test%'
ORDER BY r.created_at DESC;
