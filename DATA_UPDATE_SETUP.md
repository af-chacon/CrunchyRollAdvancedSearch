# Automated Anime Data Updates

This project uses **local systemd automation** to update the anime catalog daily from Crunchyroll and AniList.

## Architecture

### Systemd Timer (Primary)
- **When**: Daily at 1:00 AM EDT
- **Where**: Local machine via systemd
- **What**: Fetches Crunchyroll data, enriches with AniList, creates PR, auto-merges

### GitHub Actions (Fallback)
- **When**: Can be manually triggered (scheduled updates disabled due to Crunchyroll blocking GitHub IPs)
- **Where**: GitHub Actions runners
- **Status**: Disabled by default (Crunchyroll blocks GitHub Actions IPs with 403 errors)

## How It Works

1. **Systemd Timer Triggers** at 1:00 AM EDT
2. **Fetch Crunchyroll Data**: Uses anonymous API to get latest anime catalog
3. **Enhance with AniList**: Fuzzy-matches titles and adds metadata (genres, tags, studios, etc.)
4. **Validate API Formats**: Checks if Crunchyroll/AniList APIs changed structure (fails safely)
5. **Compare Data**: Detects additions, removals, and status changes
6. **Create PR**: Automatically creates a pull request with changes
7. **Auto-Merge**: Merges PR using `gh --admin` flag (bypasses branch protection)
8. **Deploy**: GitHub Pages automatically deploys the updated data

## Systemd Setup

### Files

Located in `scripts/`:

- **`crunchyroll-update.timer`**: Systemd timer (schedules daily run)
- **`crunchyroll-update.service`**: Systemd service (runs the update)
- **`update-and-deploy.sh`**: Main automation script
- **`python/update_anime_data.py`**: Python script that does the work

### Installation

The systemd files are already installed on the local machine:

```bash
# Files copied to system
/etc/systemd/system/crunchyroll-update.service
/etc/systemd/system/crunchyroll-update.timer
```

### Status Commands

```bash
# Check timer status
systemctl status crunchyroll-update.timer

# Check when next run is scheduled
systemctl list-timers crunchyroll-update.timer

# View recent logs
sudo journalctl -u crunchyroll-update.service -n 50

# Follow live logs
sudo journalctl -u crunchyroll-update.service -f

# View update log file
tail -f /var/log/crunchyroll-update.log
```

### Manual Trigger

```bash
# Run the update immediately
sudo systemctl start crunchyroll-update.service

# Or run the script directly
bash scripts/update-and-deploy.sh
```

## What Gets Updated

### Data Enhanced with AniList

Each anime entry includes:

**Core Fields** (from Crunchyroll):
- Title, description, ID
- Images, ratings
- Release dates

**Enhanced Fields** (from AniList via fuzzy matching):
- `anilist_id` - AniList database ID
- `mal_id` - MyAnimeList ID
- `genres` - Genre classifications
- `tags` - 900+ detailed tags
- `studios` - Animation studios
- `status` - Release status (FINISHED, RELEASING, etc.)
- `format` - Media format (TV, MOVIE, OVA, etc.)
- `popularity` - AniList popularity score
- `average_score` - AniList rating
- `match_score` - Fuzzy match confidence (0.6-1.0)

### Change Tracking

Change logs saved to `data_change_logs/`:

```json
{
  "timestamp": "2025-10-05T00:25:38",
  "summary": {
    "total_old": 1919,
    "total_new": 1920,
    "added_count": 1,
    "removed_count": 0,
    "status_changes_count": 2
  },
  "added": [...],
  "removed": [...],
  "status_changes": [...]
}
```

## Progress Logging

The update script provides detailed progress:

```
======================================================================
CRUNCHYROLL ANIME DATA UPDATE SCRIPT
Started at: 2025-10-05 01:00:00
======================================================================

[1/6] Loading previous anime data...
✓ Loaded 1919 previous entries

[2/6] Getting anonymous access token...
✓ Got anonymous access token

[3/6] Fetching anime catalog from Crunchyroll...
✓ Fetched 1920 of 1920 anime series

[4/6] Enhancing data with AniList metadata...
Total anime entries to enhance: 1920
  Batch 1/192 (0.5% complete) - Processing 10 titles...
    Found 8/10 AniList matches in this batch
  Batch 2/192 (1.0% complete) - Processing 10 titles...
    Found 9/10 AniList matches in this batch
  ...
✓ Enhanced 1750 entries, 170 not found

[5/6] Comparing datasets and generating change log...
...

[6/6] Saving new data to frontend/public/anime.json...
✓ Data saved successfully

======================================================================
UPDATE COMPLETED at: 2025-10-05 01:15:32
======================================================================
```

## API Format Validation

The script validates both APIs before processing:

**Crunchyroll Validation**:
- Checks for required fields: `id`, `title`, `type`, `description`
- Fails if structure changes
- Prevents committing broken data

**AniList Validation**:
- Checks for: `anilist_id`, `matched_title`, `match_score`
- Validates on first batch
- Prevents partial/corrupted enrichment

If validation fails:
```
ERROR: Crunchyroll API format has changed!
Expected fields: id, title, type, description
Received fields: [actual fields from API]
```

## GitHub Actions (Disabled)

The GitHub Actions workflow (`.github/workflows/update-anime-data.yml`) is currently disabled because Crunchyroll blocks GitHub Actions IP addresses with 403 Forbidden errors.

**Why disabled**:
- Crunchyroll detects and blocks GitHub Actions runners
- Even with browser headers and retries, requests fail
- This is a common anti-bot measure

**Can still be used for**:
- Manual testing (will likely fail)
- Documentation reference
- Future use if Crunchyroll changes policy

## Local Testing

Test the update script locally:

```bash
# Install dependencies
pip install -r scripts/python/requirements.txt

# Run update (doesn't create PR, just updates local file)
python scripts/python/update_anime_data.py

# Run full automation (creates PR and merges)
bash scripts/update-and-deploy.sh
```

## Troubleshooting

### Systemd Issues

**Timer not running:**
```bash
# Check if timer is enabled
systemctl is-enabled crunchyroll-update.timer

# Enable if needed
sudo systemctl enable crunchyroll-update.timer
sudo systemctl start crunchyroll-update.timer
```

**Service fails:**
```bash
# Check logs
sudo journalctl -u crunchyroll-update.service -n 100

# Check if script is executable
ls -la scripts/update-and-deploy.sh

# Common issues:
# - Script paths incorrect
# - Python dependencies missing
# - Git authentication issues
```

### API Issues

**Crunchyroll 403 Forbidden:**
- Retry mechanism built-in (3 attempts with exponential backoff)
- Should work on local machine (not blocked like GitHub Actions)
- If persists, Crunchyroll may be blocking your IP

**AniList Rate Limiting:**
- Script processes in batches of 10
- 1.5 second delay between batches
- Automatic retry on 429 errors
- Should handle ~2000 anime without issues

### Git/PR Issues

**PR creation fails:**
```bash
# Ensure gh CLI is authenticated
gh auth status

# Re-authenticate if needed
gh auth login
```

**Merge fails:**
```bash
# Check if you have admin permissions
gh api repos/OWNER/REPO/collaborators/USERNAME/permission

# Ensure --admin flag is in update-and-deploy.sh
grep "gh pr merge.*--admin" scripts/update-and-deploy.sh
```

## Maintenance

### Change Update Schedule

Edit `/etc/systemd/system/crunchyroll-update.timer`:

```ini
[Timer]
OnCalendar=daily
OnCalendar=*-*-* 01:00:00  # Change this time
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart crunchyroll-update.timer
```

### Disable Automation

```bash
# Stop and disable timer
sudo systemctl stop crunchyroll-update.timer
sudo systemctl disable crunchyroll-update.timer
```

### Monitor Long-term

Review change logs periodically:

```bash
# See how many changes occur
ls -lh data_change_logs/

# Analyze a specific log
cat data_change_logs/changes_2025-10-05_00-25-38.json | jq '.summary'
```

This helps determine if daily updates are necessary or if the frequency can be adjusted.
