"""
Enhance anime.json with additional data from AniList API.
Fetches genres, tags, popularity, format, and other useful metadata.
"""

import json
import requests
import time
from difflib import SequenceMatcher
from typing import List, Dict, Optional


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


def enhance_anime_data(input_file: str, output_file: str, batch_size: int = 10):
    """Enhance anime.json with AniList data."""
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        anime_data = json.load(f)

    print(f"Loaded {len(anime_data)} anime entries")
    print("\nFetching data from AniList API...")

    # Process in batches
    all_results = {}
    total_batches = (len(anime_data) + batch_size - 1) // batch_size

    for i in range(0, len(anime_data), batch_size):
        batch = anime_data[i:i + batch_size]
        titles = [item['title'] for item in batch]
        batch_num = i // batch_size + 1

        print(f"  Batch {batch_num}/{total_batches} ({len(titles)} titles)...")
        batch_results = get_anilist_data_batch(titles)
        all_results.update(batch_results)

        # Rate limiting between batches
        if i + batch_size < len(anime_data):
            time.sleep(1.5)  # Be nice to the API

    # Enhance the anime data
    print("\nEnhancing anime entries...")
    enhanced_count = 0
    not_found_count = 0

    for anime in anime_data:
        title = anime['title']
        anilist_data = all_results.get(title)

        if anilist_data:
            # Add anilist field with all the enhanced data
            anime['anilist'] = anilist_data
            enhanced_count += 1

            print(f"  ✓ {title} (match: {anilist_data['matched_title']}, score: {anilist_data['match_score']})")
        else:
            anime['anilist'] = None
            not_found_count += 1
            print(f"  ✗ {title} (no match)")

    print(f"\nEnhancement complete:")
    print(f"  Enhanced: {enhanced_count}")
    print(f"  Not found: {not_found_count}")

    # Save enhanced data
    print(f"\nSaving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(anime_data, f, indent=2, ensure_ascii=False)

    print("Done!")

    # Print some statistics
    print("\n=== Statistics ===")
    genres_count = {}
    tags_count = {}

    for anime in anime_data:
        if anime.get('anilist'):
            for genre in anime['anilist'].get('genres', []):
                genres_count[genre] = genres_count.get(genre, 0) + 1
            for tag in anime['anilist'].get('tags', []):
                tags_count[tag] = tags_count.get(tag, 0) + 1

    print(f"\nTop 10 Genres:")
    for genre, count in sorted(genres_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {genre}: {count}")

    print(f"\nTop 10 Tags:")
    for tag, count in sorted(tags_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {tag}: {count}")


if __name__ == '__main__':
    enhance_anime_data(
        input_file='frontend/public/anime.json',
        output_file='frontend/public/anime.json',
        batch_size=10
    )
