-- SQLite
-- Show all results with a violation
SELECT
    p.permalink as product_url,
    p.name as product_name,
    r.criteria as criteria,
    ROUND(r.confidence * 100, 2) as confidence_pct,
    r.reason as reason
FROM results r
JOIN products p ON r.product_id = p.id
JOIN sites s ON p.site_id = s.id
WHERE r.violates_criteria = 'true'
ORDER BY r.created_at DESC;
