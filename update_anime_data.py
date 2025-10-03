#!/usr/bin/env python3
"""
Fetch anime data from Crunchyroll, enhance with AniList data, and track changes.
Designed to run in GitHub Actions with credentials from secrets.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Set
import requests


def authenticate_crunchyroll(username: str, password: str) -> str:
    """Authenticate with Crunchyroll and return access token."""
    print("Authenticating with Crunchyroll...")

    # Crunchyroll authentication endpoint
    auth_url = "https://www.crunchyroll.com/auth/v1/token"

    headers = {
        "Authorization": "Basic aHJobzlxM2F3dnNrMjJ1LXRzNWE6cHROOURteXRBU2Z6QjZvbTVTMzGJzb04WVZEaHdCR",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "scope": "offline_access"
    }

    try:
        response = requests.post(auth_url, headers=headers, data=data, timeout=30)
        response.raise_for_status()

        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            print("ERROR: No access token in response")
            sys.exit(1)

        print("✓ Authentication successful")
        return access_token

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Authentication failed: {e}")
        sys.exit(1)


def fetch_crunchyroll_anime(access_token: str) -> List[Dict]:
    """Fetch all anime series from Crunchyroll."""
    print("Fetching anime catalog from Crunchyroll...")

    # This is the browse endpoint for all series
    url = "https://www.crunchyroll.com/content/v2/discover/browse"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    params = {
        "n": 1000,  # Max items per page
        "type": "series",
        "locale": "en-US"
    }

    all_items = []

    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        items = data.get("data", [])
        all_items.extend(items)

        print(f"✓ Fetched {len(all_items)} anime series")
        return all_items

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to fetch anime: {e}")
        sys.exit(1)


def load_previous_data(filepath: str) -> List[Dict]:
    """Load previous anime.json if it exists."""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def compare_datasets(old_data: List[Dict], new_data: List[Dict]) -> Dict:
    """Compare old and new datasets and return diff statistics."""
    old_ids = {item['id']: item for item in old_data}
    new_ids = {item['id']: item for item in new_data}

    old_id_set = set(old_ids.keys())
    new_id_set = set(new_ids.keys())

    added = new_id_set - old_id_set
    removed = old_id_set - new_id_set
    kept = old_id_set & new_id_set

    # Track status changes for kept items
    status_changes = []
    for anime_id in kept:
        old_item = old_ids[anime_id]
        new_item = new_ids[anime_id]

        # Check for AniList status changes
        old_status = old_item.get('anilist', {}).get('status', '')
        new_status = new_item.get('anilist', {}).get('status', '')

        if old_status and new_status and old_status != new_status:
            status_changes.append({
                'id': anime_id,
                'title': new_item.get('title', 'Unknown'),
                'old_status': old_status,
                'new_status': new_status
            })

    return {
        'added': [new_ids[aid] for aid in added],
        'removed': [old_ids[rid] for rid in removed],
        'status_changes': status_changes,
        'total_old': len(old_data),
        'total_new': len(new_data)
    }


def save_change_log(diff: Dict, log_dir: str):
    """Save change log with timestamp."""
    os.makedirs(log_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    log_file = os.path.join(log_dir, f'changes_{timestamp}.json')

    log_data = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_old': diff['total_old'],
            'total_new': diff['total_new'],
            'added_count': len(diff['added']),
            'removed_count': len(diff['removed']),
            'status_changes_count': len(diff['status_changes'])
        },
        'added': [{'id': item['id'], 'title': item.get('title', 'Unknown')} for item in diff['added']],
        'removed': [{'id': item['id'], 'title': item.get('title', 'Unknown')} for item in diff['removed']],
        'status_changes': diff['status_changes']
    }

    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)

    print(f"✓ Change log saved to {log_file}")
    return log_data


def print_summary(diff_summary: Dict):
    """Print a summary of changes."""
    print("\n" + "="*60)
    print("CHANGE SUMMARY")
    print("="*60)
    print(f"Previous total: {diff_summary['total_old']}")
    print(f"New total:      {diff_summary['total_new']}")
    print(f"Added:          {diff_summary['added_count']}")
    print(f"Removed:        {diff_summary['removed_count']}")
    print(f"Status changes: {diff_summary['status_changes_count']}")
    print("="*60 + "\n")


def main():
    """Main execution function."""
    # Get credentials from environment variables (set by GitHub Secrets)
    username = os.getenv('CRUNCHYROLL_USERNAME')
    password = os.getenv('CRUNCHYROLL_PASSWORD')

    if not username or not password:
        print("ERROR: CRUNCHYROLL_USERNAME and CRUNCHYROLL_PASSWORD must be set")
        sys.exit(1)

    # Paths
    anime_json_path = 'frontend/public/anime.json'
    log_dir = 'data_change_logs'

    # Load previous data
    print("Loading previous anime data...")
    old_data = load_previous_data(anime_json_path)
    print(f"✓ Loaded {len(old_data)} previous entries")

    # Authenticate and fetch new data
    access_token = authenticate_crunchyroll(username, password)
    new_raw_data = fetch_crunchyroll_anime(access_token)

    # TODO: Here we would enhance with AniList data
    # For now, we'll use the raw Crunchyroll data
    # In production, you'd call enhance_anime.py here

    # Compare datasets
    print("\nComparing datasets...")
    diff = compare_datasets(old_data, new_raw_data)

    # Save change log
    log_data = save_change_log(diff, log_dir)

    # Print summary
    print_summary(log_data['summary'])

    # Save new data
    print(f"Saving new data to {anime_json_path}...")
    with open(anime_json_path, 'w', encoding='utf-8') as f:
        json.dump(new_raw_data, f, indent=2, ensure_ascii=False)
    print("✓ Data saved successfully")

    # Set GitHub Actions output for use in commit message
    if os.getenv('GITHUB_OUTPUT'):
        with open(os.getenv('GITHUB_OUTPUT'), 'a') as f:
            f.write(f"added={log_data['summary']['added_count']}\n")
            f.write(f"removed={log_data['summary']['removed_count']}\n")
            f.write(f"status_changes={log_data['summary']['status_changes_count']}\n")


if __name__ == '__main__':
    main()
