#!/bin/bash

# CSV must have a column called `url`

# Assign the first argument to the csv_file variable
csv_file=$1

# Check if the file exists
if [ ! -f "$csv_file" ]; then
    echo "Error: File '$csv_file' does not exist."
    exit 1
fi

# Use DuckDB to read the CSV file and process each URL
urls=$(duckdb -csv -c "SELECT url FROM read_csv_auto('$csv_file');")

# Skip the first row (header)
urls=$(echo "$urls" | tail -n +2)

# Get only the first X URLs from the list
urls_to_check=$(echo "$urls" | head -n 20)
for url in $urls_to_check; do
    echo "Checking $url..."
    # pass through all arguments to npm start
    npm start "$url" -- "$@"
done

npm run export

echo "All products have been checked."
