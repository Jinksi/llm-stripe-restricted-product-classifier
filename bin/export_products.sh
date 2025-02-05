#!/bin/bash

# Export a CSV with all products with their violations and reasoning
echo 'SELECT s.url as site_url, p.name as product_name, p.permalink, r.criteria, r.violates_criteria, r.reason, r.model_id, r.created_at as evaluation_created_at FROM sites s LEFT JOIN products p ON s.id = p.site_id LEFT JOIN results r ON p.id = r.product_id;' \
  | sqlite3 -header -csv ./db/db.sqlite > product_violations_export.csv