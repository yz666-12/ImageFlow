#!/bin/bash

# Create cmd directory if it doesn't exist
mkdir -p cmd

# Build the migration tool
echo "Building migration tool..."
go build -o ./migrate_tool ./cmd/migrate

# Run the migration tool
echo "Running migration..."
./migrate_tool "$@"

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
else
    echo "Migration failed!"
    exit 1
fi
