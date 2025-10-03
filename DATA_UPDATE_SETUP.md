# Automated Anime Data Updates

This project includes automated daily updates of the anime catalog from Crunchyroll.

## How It Works

1. **Daily Schedule**: The GitHub Action runs every day at 2 AM UTC (6 PM PST / 7 PM PDT)
2. **Authentication**: Uses Crunchyroll credentials stored in GitHub Secrets
3. **Data Fetch**: Fetches the latest anime catalog from Crunchyroll's API
4. **Change Tracking**: Compares with previous data and logs:
   - New anime added
   - Anime removed
   - Status changes (e.g., "RELEASING" → "FINISHED")
5. **Auto-commit**: If changes are detected, automatically commits and pushes to the repository
6. **Auto-deploy**: The commit triggers the GitHub Pages deployment workflow

## Setup Instructions

### 1. Add GitHub Secrets

Go to your repository settings → Secrets and variables → Actions → New repository secret

Add two secrets:

- **Name**: `CRUNCHYROLL_USERNAME`
  - **Value**: Your Crunchyroll email/username

- **Name**: `CRUNCHYROLL_PASSWORD`
  - **Value**: Your Crunchyroll password

### 2. Enable Workflow

The workflow file is located at `.github/workflows/update-anime-data.yml`

It's enabled by default and will run:
- Automatically every day at 2 AM UTC
- Manually from the Actions tab (click "Run workflow")

### 3. Monitor Updates

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

### Token Expiration

If authentication fails:
1. Check the workflow run logs in the Actions tab
2. You may need to update the credentials in GitHub Secrets
3. Crunchyroll passwords typically last much longer than API tokens

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
  "timestamp": "2025-10-03T02:00:00",
  "summary": {
    "total_old": 1234,
    "total_new": 1237,
    "added_count": 5,
    "removed_count": 2,
    "status_changes_count": 3
  },
  "added": [...],
  "removed": [...],
  "status_changes": [...]
}
```

After a few weeks, review the logs to see:
- How many changes occur daily
- Whether daily updates are necessary
- Optimal update frequency for your needs

## Troubleshooting

**Workflow fails with authentication error:**
- Verify credentials in GitHub Secrets are correct
- Try logging into Crunchyroll manually with the same credentials
- Check if Crunchyroll has rate limits or security measures

**No changes detected but you expect changes:**
- The Crunchyroll API may have rate limiting
- Check the workflow logs for any errors
- Try running the update script locally first

**Workflow doesn't trigger:**
- Ensure the workflow file has no syntax errors
- Check that GitHub Actions are enabled for your repository
- Verify the cron schedule is correct (uses UTC timezone)
