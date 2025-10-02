import json
from filter import parse_items

if __name__ == '__main__':
    items = parse_items('output.txt')
    print(f"Parsed {len(items)} items")

    # Convert items to dict format
    anime_list = []
    for item in items:
        anime_list.append({
            'id': item.id,
            'title': item.title,
            'description': item.description,
            'rating': item.rating.average,
            'total_ratings': item.rating.total,
            'episode_count': item.series_metadata.episode_count,
            'season_count': item.series_metadata.season_count,
            'series_launch_year': item.series_metadata.series_launch_year,
            'is_mature': item.series_metadata.is_mature,
            'is_dubbed': item.series_metadata.is_dubbed,
            'is_subbed': item.series_metadata.is_subbed,
            'audio_locales': item.series_metadata.audio_locales,
            'subtitle_locales': item.series_metadata.subtitle_locales,
            'content_descriptors': item.series_metadata.content_descriptors or [],
            'tenant_categories': item.series_metadata.tenant_categories or [],
            # Use higher resolution image (480x720 - index 3)
            'poster': item.images.poster_tall[0][3].source if item.images.poster_tall and len(item.images.poster_tall[0]) > 3 else (item.images.poster_tall[0][0].source if item.images.poster_tall else None)
        })

    # Write to public directory
    with open('frontend/public/anime.json', 'w', encoding='utf-8') as f:
        json.dump(anime_list, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(anime_list)} anime to frontend/public/anime.json")
