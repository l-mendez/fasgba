#!/bin/bash
# Setup script for git worktrees - copies environment files and installs dependencies
# Usage: Run this script from the worktree directory after creating it

set -e

# Find the main worktree (original repo)
MAIN_WORKTREE=$(git worktree list | head -1 | awk '{print $1}')
CURRENT_DIR=$(pwd)

if [ "$MAIN_WORKTREE" = "$CURRENT_DIR" ]; then
  echo "This script should be run from a worktree, not the main repository."
  exit 1
fi

echo "Main repo: $MAIN_WORKTREE"
echo "Worktree:  $CURRENT_DIR"

# Copy environment files
if [ -f "$MAIN_WORKTREE/.env.local" ]; then
  cp "$MAIN_WORKTREE/.env.local" "$CURRENT_DIR/.env.local"
  echo "✓ Copied .env.local"
else
  echo "⚠ No .env.local found in main repo"
fi

if [ -f "$MAIN_WORKTREE/.env" ]; then
  cp "$MAIN_WORKTREE/.env" "$CURRENT_DIR/.env"
  echo "✓ Copied .env"
fi

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

echo "Worktree setup complete!"
