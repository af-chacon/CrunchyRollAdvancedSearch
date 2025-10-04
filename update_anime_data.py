#!/usr/bin/env python3
"""
Fetch anime data from Crunchyroll (anonymous API), enhance with AniList data, and track changes.
Designed to run in GitHub Actions.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List
import requests


def get_anonymous_token() -> str:
    """Get an anonymous access token from Crunchyroll."""
    print("Getting anonymous access token from Crunchyroll...")

    # Crunchyroll's public OAuth client credentials for anonymous access
    auth_header = "Basic Y3Jfd2ViOg=="

    auth_url = "https://www.crunchyroll.com/auth/v1/token"

    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0"
    }

    data = {
        "grant_type": "client_id"
    }

    try:
        response = requests.post(auth_url, headers=headers, data=data, timeout=30)
        response.raise_for_status()

        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            print("ERROR: No access token in response")
            sys.exit(1)

        print("✓ Got anonymous access token")
        return access_token

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to get token: {e}")
        sys.exit(1)


def fetch_crunchyroll_anime(access_token: str) -> List[Dict]:
    """Fetch all anime series from Crunchyroll."""
    print("Fetching anime catalog from Crunchyroll...")

    url = "https://www.crunchyroll.com/content/v2/discover/browse"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
        "Accept": "application/json, text/plain, */*"
    }

    params = {
        "n": 2000,  # Fetch up to 2000 items
        "type": "series",
        "locale": "en-US",
        "sort_by": "alphabetical",
        "ratings": "true",
        "preferred_audio_language": "ja-JP"
    }

    all_items = []

    try:
        response = requests.get(url, headers=headers, params=params, timeout=60)
        response.raise_for_status()

        data = response.json()
        items = data.get("data", [])
        total = data.get("total", 0)
        all_items.extend(items)

        print(f"✓ Fetched {len(all_items)} of {total} anime series")
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

        # Check for AniList status changes (only if anilist data exists)
        old_anilist = old_item.get('anilist') if old_item.get('anilist') is not None else {}
        new_anilist = new_item.get('anilist') if new_item.get('anilist') is not None else {}

        old_status = old_anilist.get('status', '')
        new_status = new_anilist.get('status', '')

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
    # Paths
    anime_json_path = 'frontend/public/anime.json'
    log_dir = 'data_change_logs'

    # Load previous data
    print("Loading previous anime data...")
    old_data = load_previous_data(anime_json_path)
    print(f"✓ Loaded {len(old_data)} previous entries")

    # Get anonymous token and fetch new data
    access_token = get_anonymous_token()
    new_raw_data = fetch_crunchyroll_anime(access_token)

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
