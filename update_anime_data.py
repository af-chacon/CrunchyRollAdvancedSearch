#!/usr/bin/env python3
"""
Fetch anime data from Crunchyroll (anonymous API), enhance with AniList data, and track changes.
Designed to run in GitHub Actions.
"""

import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional
from difflib import SequenceMatcher
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


def similarity(a: str, b: str) -> float:
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def get_anilist_data_batch(titles: List[str]) -> Dict[str, Optional[Dict]]:
    """Query AniList API for multiple anime in a single request."""
    query_parts = []
    for i, title in enumerate(titles):
        alias = f"anime{i}"
        safe_title = title.replace('"', '\\"')
        query_parts.append(f'''
        {alias}: Page(page: 1, perPage: 3) {{
          media(search: "{safe_title}", type: ANIME, sort: SEARCH_MATCH) {{
            id
            idMal
            title {{
              romaji
              english
              native
            }}
            startDate {{
              year
              month
              day
            }}
            endDate {{
              year
              month
              day
            }}
            format
            status
            episodes
            duration
            genres
            tags {{
              name
              rank
              isMediaSpoiler
            }}
            popularity
            averageScore
            meanScore
            studios {{
              nodes {{
                name
                isAnimationStudio
              }}
            }}
            season
            seasonYear
          }}
        }}
        ''')

    query = "query {\n" + "\n".join(query_parts) + "\n}"
    results = {}

    try:
        response = requests.post(
            'https://graphql.anilist.co',
            json={'query': query},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json().get('data', {})

            for i, title in enumerate(titles):
                alias = f"anime{i}"
                media_list = data.get(alias, {}).get('media', [])

                if not media_list:
                    results[title] = None
                    continue

                # Find best match using fuzzy matching
                best_match = None
                best_score = 0.0

                for media in media_list:
                    anime_titles = [
                        media.get('title', {}).get('romaji'),
                        media.get('title', {}).get('english'),
                        media.get('title', {}).get('native')
                    ]

                    for anime_title in anime_titles:
                        if anime_title:
                            score = similarity(title, anime_title)
                            if score > best_score:
                                best_score = score
                                best_match = media

                # Only accept matches with similarity > 0.6
                if best_match and best_score > 0.6:
                    # Extract non-spoiler tags with rank >= 60
                    tags = best_match.get('tags', []) or []
                    filtered_tags = [
                        tag['name'] for tag in tags
                        if not tag.get('isMediaSpoiler', False) and tag.get('rank', 0) >= 60
                    ]

                    # Get animation studios only
                    studios = best_match.get('studios', {}).get('nodes', []) or []
                    animation_studios = [
                        studio['name'] for studio in studios
                        if studio.get('isAnimationStudio', False)
                    ]

                    matched_title = (
                        best_match.get('title', {}).get('english') or
                        best_match.get('title', {}).get('romaji')
                    )

                    results[title] = {
                        'anilist_id': best_match.get('id'),
                        'mal_id': best_match.get('idMal'),
                        'matched_title': matched_title,
                        'match_score': round(best_score, 3),
                        'start_date': best_match.get('startDate'),
                        'end_date': best_match.get('endDate'),
                        'format': best_match.get('format'),
                        'status': best_match.get('status'),
                        'episodes': best_match.get('episodes'),
                        'duration': best_match.get('duration'),
                        'genres': best_match.get('genres', []) or [],
                        'tags': filtered_tags,
                        'popularity': best_match.get('popularity'),
                        'average_score': best_match.get('averageScore'),
                        'mean_score': best_match.get('meanScore'),
                        'studios': animation_studios,
                        'season': best_match.get('season'),
                        'season_year': best_match.get('seasonYear'),
                    }
                else:
                    results[title] = None

        elif response.status_code == 429:
            print("  Rate limited, waiting 60s...")
            time.sleep(60)
            return get_anilist_data_batch(titles)
        else:
            print(f"  API error: {response.status_code}")
            return {title: None for title in titles}

    except Exception as e:
        print(f"  Error fetching batch: {e}")
        return {title: None for title in titles}

    return results


def validate_crunchyroll_format(item: Dict) -> bool:
    """Validate that a Crunchyroll item has the expected format."""
    required_fields = ['id', 'title', 'type', 'description']
    return all(field in item for field in required_fields)


def validate_anilist_format(item: Dict) -> bool:
    """Validate that an AniList item has the expected format."""
    if not item:
        return True  # None is acceptable for no match
    required_fields = ['anilist_id', 'matched_title', 'match_score']
    return all(field in item for field in required_fields)


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

        # Validate format of first item
        if all_items and not validate_crunchyroll_format(all_items[0]):
            print("ERROR: Crunchyroll API format has changed!")
            print(f"Expected fields: id, title, type, description")
            print(f"Received fields: {list(all_items[0].keys())}")
            sys.exit(1)

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


def enhance_with_anilist(anime_data: List[Dict], batch_size: int = 10) -> tuple[int, int]:
    """Enhance anime data with AniList information."""
    print("\nEnhancing with AniList data...")

    all_results = {}
    total_batches = (len(anime_data) + batch_size - 1) // batch_size

    for i in range(0, len(anime_data), batch_size):
        batch = anime_data[i:i + batch_size]
        titles = [item['title'] for item in batch]
        batch_num = i // batch_size + 1

        print(f"  Batch {batch_num}/{total_batches} ({len(titles)} titles)...")
        batch_results = get_anilist_data_batch(titles)
        all_results.update(batch_results)

        # Validate format of first non-None result
        if i == 0:
            first_valid_result = next((v for v in batch_results.values() if v is not None), None)
            if first_valid_result and not validate_anilist_format(first_valid_result):
                print("ERROR: AniList API format has changed!")
                print(f"Expected fields: anilist_id, matched_title, match_score")
                print(f"Received fields: {list(first_valid_result.keys())}")
                sys.exit(1)

        # Rate limiting between batches
        if i + batch_size < len(anime_data):
            time.sleep(1.5)  # Be nice to the API

    # Enhance the anime data
    enhanced_count = 0
    not_found_count = 0

    for anime in anime_data:
        title = anime['title']
        anilist_data = all_results.get(title)

        if anilist_data:
            anime['anilist'] = anilist_data
            enhanced_count += 1
        else:
            anime['anilist'] = None
            not_found_count += 1

    print(f"✓ Enhanced {enhanced_count} entries, {not_found_count} not found")
    return enhanced_count, not_found_count


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

    # Enhance new data with AniList
    enhanced_count, not_found_count = enhance_with_anilist(new_raw_data)

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
            f.write(f"enhanced={enhanced_count}\n")
            f.write(f"not_found={not_found_count}\n")


if __name__ == '__main__':
    main()
