from dataclasses import dataclass
from typing import List, Optional, Any


@dataclass
class ImageVariant:
    height: int
    source: str
    type: str
    width: int


@dataclass
class RatingBreakdown:
    displayed: str
    percentage: int
    unit: str


@dataclass
class Rating:
    average: str
    total: int
    rating: str
    ones: RatingBreakdown  # for "1s"
    twos: RatingBreakdown  # for "2s"
    threes: RatingBreakdown  # for "3s"
    fours: RatingBreakdown  # for "4s"
    fives: RatingBreakdown  # for "5s"


@dataclass
class ExtendedMaturityRating:
    level: str = ''
    rating: str = ''
    system: str = ''


@dataclass
class SeriesMetadata:
    audio_locales: List[str]
    availability_notes: str
    episode_count: int
    extended_description: str
    extended_maturity_rating: ExtendedMaturityRating
    is_dubbed: bool
    is_mature: bool
    is_simulcast: bool
    is_subbed: bool
    mature_blocked: bool
    maturity_ratings: List[str]
    season_count: int
    series_launch_year: int
    subtitle_locales: List[str]
    tenant_categories: Optional[List[str]] = None
    content_descriptors: Optional[List[str]] = None
    awards: Optional[Any] = None
    livestream: Optional[Any] = None


@dataclass
class Images:
    poster_tall: List[List[ImageVariant]]
    poster_wide: List[List[ImageVariant]]


@dataclass
class CrunchyrollItem:
    external_id: str
    promo_description: str
    rating: Rating
    description: str
    id: str
    promo_title: str
    type: str
    new: bool
    slug_title: str
    series_metadata: SeriesMetadata
    linked_resource_key: str
    channel_id: str
    slug: str
    images: Images
    title: str
    last_public: str


import json
import requests
import time
from difflib import SequenceMatcher


def parse_items(filepath: str) -> List[CrunchyrollItem]:
    """Parse Crunchyroll items from JSON file."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    items = []
    for item_data in data['data']:
        rating_data = item_data['rating']
        rating = Rating(
            average=rating_data['average'],
            total=rating_data['total'],
            rating=rating_data.get('rating', ''),
            ones=RatingBreakdown(**rating_data['1s']),
            twos=RatingBreakdown(**rating_data['2s']),
            threes=RatingBreakdown(**rating_data['3s']),
            fours=RatingBreakdown(**rating_data['4s']),
            fives=RatingBreakdown(**rating_data['5s'])
        )

        series_meta = item_data['series_metadata']
        ext_maturity = ExtendedMaturityRating(**series_meta['extended_maturity_rating'])

        # Filter known fields
        known_fields = {
            'audio_locales', 'availability_notes', 'content_descriptors', 'episode_count',
            'extended_description', 'is_dubbed', 'is_mature', 'is_simulcast', 'is_subbed',
            'mature_blocked', 'maturity_ratings', 'season_count', 'series_launch_year',
            'subtitle_locales', 'tenant_categories', 'awards', 'livestream'
        }
        filtered_meta = {k: v for k, v in series_meta.items() if k in known_fields and k != 'extended_maturity_rating'}

        series_metadata = SeriesMetadata(
            **filtered_meta,
            extended_maturity_rating=ext_maturity
        )

        images_data = item_data['images']
        images = Images(
            poster_tall=[[ImageVariant(**img) for img in variant] for variant in images_data['poster_tall']],
            poster_wide=[[ImageVariant(**img) for img in variant] for variant in images_data['poster_wide']]
        )

        item = CrunchyrollItem(
            **{k: v for k, v in item_data.items() if k not in ['rating', 'series_metadata', 'images']},
            rating=rating,
            series_metadata=series_metadata,
            images=images
        )
        items.append(item)

    return items


def similarity(a: str, b: str) -> float:
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def get_anime_years_batch(titles: List[str]) -> dict:
    """Query AniList API for multiple anime release years in a single request."""
    # Build query with aliases for each title
    query_parts = []
    for i, title in enumerate(titles):
        # Create a safe alias name
        alias = f"anime{i}"
        # Escape quotes in title for GraphQL
        safe_title = title.replace('"', '\\"')
        query_parts.append(f'''
        {alias}: Page(page: 1, perPage: 3) {{
          media(search: "{safe_title}", type: ANIME, sort: SEARCH_MATCH) {{
            startDate {{
              year
            }}
            title {{
              romaji
              english
            }}
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
                        media.get('title', {}).get('english')
                    ]

                    for anime_title in anime_titles:
                        if anime_title:
                            score = similarity(title, anime_title)
                            if score > best_score:
                                best_score = score
                                best_match = media

                # Only accept matches with similarity > 0.6
                if best_match and best_score > 0.6:
                    year = best_match.get('startDate', {}).get('year')
                    matched_title = best_match.get('title', {}).get('english') or best_match.get('title', {}).get('romaji')
                    if year:
                        results[title] = {
                            'year': year,
                            'matched_title': matched_title,
                            'score': best_score
                        }
                    else:
                        results[title] = None
                else:
                    results[title] = None

        elif response.status_code == 429:
            print("  Rate limited, waiting...")
            time.sleep(60)
            return get_anime_years_batch(titles)

    except Exception as e:
        print(f"  Error fetching batch: {e}")
        return {title: None for title in titles}

    return results


def generate_html_table(final_items: List[tuple], not_found_items: List[CrunchyrollItem]):
    """Generate an HTML DataTable with the filtered anime."""
    html = '''<!DOCTYPE html>
<html>
<head>
    <title>Mature Anime Filter Results</title>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        h1, h2 {
            color: #333;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        table.dataTable {
            width: 100% !important;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            margin: 2px;
            background-color: #e0e0e0;
            border-radius: 3px;
            font-size: 0.85em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Mature Anime Filter Results (2015+)</h1>
        <p>Filtered anime with mature content (nudity/sexual themes) released in 2015 or later.</p>
        <table id="animeTable" class="display">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Release Year</th>
                    <th>Rating</th>
                    <th>Episodes</th>
                    <th>Content Descriptors</th>
                    <th>Categories</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
'''

    for item, year in final_items:
        descriptors = item.series_metadata.content_descriptors or []
        descriptors_html = ''.join([f'<span class="badge">{d}</span>' for d in descriptors])

        categories = item.series_metadata.tenant_categories or []
        categories_html = ''.join([f'<span class="badge">{c}</span>' for c in categories])

        description = item.description.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')

        html += f'''                <tr>
                    <td>{item.title}</td>
                    <td>{year}</td>
                    <td>{item.rating.average}</td>
                    <td>{item.series_metadata.episode_count}</td>
                    <td>{descriptors_html}</td>
                    <td>{categories_html}</td>
                    <td>{description}</td>
                </tr>
'''

    html += '''            </tbody>
        </table>
    </div>
'''

    if not_found_items:
        html += '''
    <div class="container">
        <h2>Items Without AniList Match</h2>
        <p>These items could not be verified against AniList database.</p>
        <table id="notFoundTable" class="display">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Episodes</th>
                    <th>Content Descriptors</th>
                    <th>Categories</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
'''
        for item in not_found_items:
            descriptors = item.series_metadata.content_descriptors or []
            descriptors_html = ''.join([f'<span class="badge">{d}</span>' for d in descriptors])

            categories = item.series_metadata.tenant_categories or []
            categories_html = ''.join([f'<span class="badge">{c}</span>' for c in categories])

            description = item.description.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')

            html += f'''                <tr>
                    <td>{item.title}</td>
                    <td>{item.series_metadata.episode_count}</td>
                    <td>{descriptors_html}</td>
                    <td>{categories_html}</td>
                    <td>{description}</td>
                </tr>
'''
        html += '''            </tbody>
        </table>
    </div>
'''

    html += '''
    <script>
        $(document).ready(function() {
            $('#animeTable').DataTable({
                pageLength: 25,
                order: [[1, 'desc']]
            });
            $('#notFoundTable').DataTable({
                pageLength: 10
            });
        });
    </script>
</body>
</html>
'''

    with open('anime_results.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("HTML table saved to anime_results.html")


if __name__ == '__main__':
    items = parse_items('output.txt')
    print(f"Parsed {len(items)} items")

    mature_items = [item for item in items if item.series_metadata.is_mature]
    print(f"Mature items: {len(mature_items)}")

    # Filter for items with nudity or sex-related content descriptors
    filtered_items = []
    for item in mature_items:
        descriptors = item.series_metadata.content_descriptors or []
        if any('nudity' in d.lower() or 'sex' in d.lower() for d in descriptors):
            filtered_items.append(item)

    print(f"Filtered items (nudity/sex): {len(filtered_items)}")
    print("\nFetching actual release years from AniList API...")

    # Batch fetch in groups of 20 to avoid query size limits
    batch_size = 20
    all_results = {}

    for i in range(0, len(filtered_items), batch_size):
        batch = filtered_items[i:i + batch_size]
        titles = [item.title for item in batch]

        print(f"  Fetching batch {i // batch_size + 1}/{(len(filtered_items) + batch_size - 1) // batch_size}...")
        batch_results = get_anime_years_batch(titles)
        all_results.update(batch_results)

        # Rate limiting between batches
        if i + batch_size < len(filtered_items):
            time.sleep(1)

    # Process results and filter by year
    final_items = []
    not_found_items = []

    for item in filtered_items:
        result = all_results.get(item.title)
        if result:
            year = result['year']
            matched_title = result['matched_title']
            score = result['score']
            print(f"  {item.title}: {year} (matched: {matched_title}, score: {score:.2f})")
            if year >= 2015:
                final_items.append((item, year))
        else:
            print(f"  {item.title}: Could not find year")
            not_found_items.append(item)

    print(f"\nFiltered items (2015+ based on AniList): {len(final_items)}")

    for item, year in final_items:
        descriptors = item.series_metadata.content_descriptors or []
        descriptors_str = ', '.join(descriptors) if descriptors else 'None'
        print(f"- {item.title} ({year}) [{descriptors_str}]")

    if not_found_items:
        print(f"\n\nItems without AniList match ({len(not_found_items)}):")
        for item in not_found_items:
            descriptors = item.series_metadata.content_descriptors or []
            descriptors_str = ', '.join(descriptors) if descriptors else 'None'
            print(f"- {item.title} [{descriptors_str}]")

    # Generate HTML output
    print("\n\nGenerating HTML output...")
    generate_html_table(final_items, not_found_items)