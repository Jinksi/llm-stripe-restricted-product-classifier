#!/bin/bash

# Export a CSV with all sites and their violation status and summary
echo 'SELECT s.url as site_url, s.violation_status, s.violation_summary FROM sites s;' \
  | sqlite3 -header -csv ./db/db.sqlite > sites_export.csv