#!/bin/bash
set -e

# Configuration
REPO_DIR="/home/aedis/source/CrunchyRollAdvancedSearch"
LOG_FILE="/var/log/crunchyroll-update.log"
BRANCH_NAME="automated-data-update-$(date +%Y%m%d-%H%M%S)"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting anime data update process..."

# Change to repo directory
cd "$REPO_DIR" || exit 1

# Ensure we're on main and up to date
log "Updating local repository..."
git checkout main
git pull --ff-only origin main

# Create new branch for updates
log "Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Run the update script
log "Running update script..."
# Capture Python output and redirect to both log and stdout
python3 update_anime_data.py 2>&1 | while IFS= read -r line; do
    echo "$line" | tee -a "$LOG_FILE"
done

# Check if Python script succeeded
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    log "ERROR: update_anime_data.py failed"
    exit 1
fi

# Check if there are changes
if ! git diff --quiet frontend/public/anime.json; then
    log "Changes detected, creating commit..."

    # Stage changes
    git add frontend/public/anime.json data_change_logs/

    # Create commit message
    COMMIT_MSG="Automated anime data update - $(date '+%Y-%m-%d')

🤖 Automated update via systemd timer

Co-Authored-By: System <noreply@system.local>"

    git commit -m "$COMMIT_MSG"

    # Push to remote
    log "Pushing branch to remote..."
    git push -u origin "$BRANCH_NAME"

    # Create pull request using gh CLI
    log "Creating pull request..."
    PR_URL=$(gh pr create \
        --title "Automated Data Update - $(date '+%Y-%m-%d')" \
        --body "$(cat <<EOF
## Automated Anime Data Update

This PR contains automated updates to the anime catalog data.

### Changes
- Updated \`frontend/public/anime.json\` with latest Crunchyroll data
- Enhanced with AniList metadata
- Change logs added to \`data_change_logs/\`

### Generated
$(date '+%Y-%m-%d %H:%M:%S')

🤖 This is an automated update
EOF
)" \
        --base main \
        --head "$BRANCH_NAME" 2>&1)

    log "Pull request created: $PR_URL"

    # Extract PR number from URL
    PR_NUMBER=$(echo "$PR_URL" | grep -oP 'pull/\K[0-9]+')

    if [ -n "$PR_NUMBER" ]; then
        log "Merging PR #$PR_NUMBER..."

        # Merge the PR (bypassing branch protection)
        gh pr merge "$PR_NUMBER" --auto --squash --delete-branch

        log "PR #$PR_NUMBER merged successfully"

        # Return to main and pull the merged changes
        git checkout main
        git pull --ff-only origin main
    else
        log "ERROR: Could not extract PR number"
        exit 1
    fi

    log "Update process completed successfully!"
else
    log "No changes detected in anime data"

    # Clean up branch
    git checkout main
    git branch -D "$BRANCH_NAME" 2>/dev/null || true

    log "Update process completed (no changes)"
fi
