#!/bin/bash

# Supabase CLI Wrapper Script
# Usage: ./scripts/db.sh [command]

COMMAND=$1
SHIFT_ARGS="${@:2}"

case $COMMAND in
  "up")
    echo "🚀 Applying migrations to remote database..."
    npx supabase db push
    ;;
  "down")
    echo "⚠️ Resetting local database..."
    npx supabase db reset
    ;;
  "new")
    echo "🆕 Creating new migration..."
    npx supabase migration new $SHIFT_ARGS
    ;;
  "status")
    echo "📊 Checking database status..."
    npx supabase status
    ;;
  "diff")
    echo "🔍 Diffing local changes..."
    npx supabase db diff -f $SHIFT_ARGS
    ;;
  "gen")
    echo "🧬 Generating TypeScript types..."
    npx supabase gen types typescript --project-id asbeqdirwerktimsyvdc > src/lib/database.types.ts
    ;;
  *)
    echo "Usage: ./scripts/db.sh [up|down|new|status|diff|gen]"
    echo "  - up: Apply migrations to remote database"
    echo "  - down: Reset local database"
    echo "  - new: Create new migration"
    echo "  - status: Check database status"
    echo "  - diff: Diff local changes"
    echo "  - gen: Generate TypeScript types"
    exit 1
    ;;
esac
