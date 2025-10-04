# Automated Anime Data Updates

This project includes automated daily updates of the anime catalog from Crunchyroll.

## How It Works

1. **Daily Schedule**: The GitHub Action runs every day at 2 AM UTC (6 PM PST / 7 PM PDT)
2. **Anonymous Access**: Uses Crunchyroll's public anonymous API (no login required!)
3. **Data Fetch**: Fetches the latest anime catalog from Crunchyroll's browse API
4. **Change Tracking**: Compares with previous data and logs:
   - New anime added
   - Anime removed
   - Status changes (e.g., "RELEASING" → "FINISHED")
5. **Auto-commit**: If changes are detected, automatically commits and pushes to the repository
6. **Auto-deploy**: The commit triggers the GitHub Pages deployment workflow

## Setup Instructions

### Enable Workflow

The workflow file is located at `.github/workflows/update-anime-data.yml`

It's enabled by default and will run:
- Automatically every day at 2 AM UTC
- Manually from the Actions tab (click "Run workflow")

**No credentials required!** The script uses Crunchyroll's anonymous public API.

### Monitor Updates

**View Change Logs:**
- Change logs are saved to `data_change_logs/` directory
- Each run creates a timestamped JSON file with details
- Files include:
  - List of added anime (id and title)
  - List of removed anime (id and title)
  - Status changes with old/new status
  - Summary statistics

**View Workflow Runs:**
1. Go to the "Actions" tab in your repository
2. Click on "Update Anime Data" workflow
3. View recent runs and their logs

**Commit Messages:**
Automatic commits include statistics, e.g.:
```
Update anime data - Added: 5, Removed: 2, Status changes: 3
```

## Maintenance

### Manual Run

To manually trigger an update:
1. Go to Actions tab
2. Select "Update Anime Data" workflow
3. Click "Run workflow" button
4. Select the branch (usually `main`)
5. Click "Run workflow"

### Adjust Update Frequency

To change how often the workflow runs, edit `.github/workflows/update-anime-data.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Cron syntax examples:
- `0 */6 * * *` - Every 6 hours
- `0 2 * * 0` - Weekly on Sunday at 2 AM
- `0 2 1 * *` - Monthly on the 1st at 2 AM

## Change Log Analysis

Change logs are stored as JSON and can be analyzed to determine optimal update frequency.

Example log structure:
```json
{
  "timestamp": "2025-10-04T13:38:41",
  "summary": {
    "total_old": 1909,
    "total_new": 1919,
    "added_count": 10,
    "removed_count": 0,
    "status_changes_count": 0
  },
  "added": [
    {
      "id": "GW4HM7WQ5",
      "title": "May I Ask for One Final Thing?"
    }
  ],
  "removed": [],
  "status_changes": []
}
```

After a few weeks, review the logs to see:
- How many changes occur daily
- Whether daily updates are necessary
- Optimal update frequency for your needs

## Local Testing

You can test the update script locally:

```bash
python update_anime_data.py
```

This will:
1. Get an anonymous token from Crunchyroll
2. Fetch the current anime catalog
3. Compare with your existing data
4. Save a change log
5. Update `frontend/public/anime.json`

## Troubleshooting

**Workflow doesn't trigger:**
- Ensure the workflow file has no syntax errors
- Check that GitHub Actions are enabled for your repository
- Verify the cron schedule is correct (uses UTC timezone)

**API rate limiting:**
- Crunchyroll may rate limit anonymous requests
- The script includes reasonable timeouts
- Daily updates should be well within limits

**No changes detected but you expect changes:**
- Crunchyroll may not have updated their catalog
- Check the workflow logs for any errors
- Try running the update script locally first
