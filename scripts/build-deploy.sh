#!/bin/bash
# Build & deploy script for Cloudflare Git integration.
# Handles KV namespace creation and wrangler.toml configuration automatically.

set -e

# Check if wrangler.toml has a real KV ID or the placeholder
KV_ID=$(grep 'id = ' wrangler.toml | head -1 | sed 's/.*id = "\(.*\)"/\1/')

if [ "$KV_ID" = "YOUR_KV_NAMESPACE_ID" ] || [ -z "$KV_ID" ]; then
  echo "Creating KV namespace..."
  OUTPUT=$(npx wrangler kv namespace create START_PAGE_DATA 2>&1)
  NEW_ID=$(echo "$OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | sed 's/id = "\(.*\)"/\1/')

  if [ -n "$NEW_ID" ]; then
    echo "KV namespace created: $NEW_ID"
    sed -i "s/YOUR_KV_NAMESPACE_ID/$NEW_ID/" wrangler.toml
  else
    echo "Warning: Could not create KV namespace. Output: $OUTPUT"
    echo "Trying to deploy anyway..."
  fi
fi

npx wrangler deploy
