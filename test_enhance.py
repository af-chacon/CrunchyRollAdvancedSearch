"""Test enhancement script on a small sample."""

import json
from enhance_anime import enhance_anime_data

# Create a small test file with first 10 anime
with open('frontend/public/anime.json', 'r', encoding='utf-8') as f:
    all_anime = json.load(f)

test_data = all_anime[:10]

with open('test_anime.json', 'w', encoding='utf-8') as f:
    json.dump(test_data, f, indent=2, ensure_ascii=False)

print("Created test_anime.json with 10 entries")
print("\nTesting enhancement...")

enhance_anime_data(
    input_file='test_anime.json',
    output_file='test_anime_enhanced.json',
    batch_size=5
)

print("\nTest complete! Check test_anime_enhanced.json")
