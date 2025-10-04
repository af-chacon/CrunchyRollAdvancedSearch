#!/usr/bin/env python3
"""
Test script to verify Crunchyroll API access.
This will help us understand the authentication flow before running the full update.
"""

import json
import requests
import sys

def test_authentication(username: str, password: str):
    """Test Crunchyroll authentication."""
    print("Testing Crunchyroll authentication...")
    print(f"Username: {username}")

    # This is Crunchyroll's public OAuth client ID (base64 encoded)
    # Format: client_id:client_secret
    # This is publicly known and used by their web app
    auth_header = "Basic aHJobzlxM2F3dnNrMjJ1LXRzNWE6cHROOURteXRBU2Z6QjZvbTVTMzRtc2I4WVZEaHdCR2c="

    auth_url = "https://www.crunchyroll.com/auth/v1/token"

    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
    }

    data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "scope": "offline_access"
    }

    try:
        print("\nAttempting authentication...")
        response = requests.post(auth_url, headers=headers, data=data, timeout=30)

        print(f"Status code: {response.status_code}")

        if response.status_code == 200:
            token_data = response.json()
            print("\n✓ Authentication successful!")
            print(f"Token type: {token_data.get('token_type')}")
            print(f"Expires in: {token_data.get('expires_in')} seconds")
            print(f"Access token: {token_data.get('access_token')[:50]}...")
            return token_data.get('access_token')
        else:
            print(f"\n✗ Authentication failed!")
            print(f"Response: {response.text}")
            return None

    except Exception as e:
        print(f"\n✗ Error during authentication: {e}")
        return None


def test_browse_api(access_token: str):
    """Test fetching anime from browse API."""
    print("\n" + "="*60)
    print("Testing browse API...")

    url = "https://www.crunchyroll.com/content/v2/discover/browse"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "User-Agent": "Mozilla/5.0"
    }

    params = {
        "n": 10,  # Just fetch 10 for testing
        "type": "series",
        "locale": "en-US"
    }

    try:
        print("Fetching anime catalog...")
        response = requests.get(url, headers=headers, params=params, timeout=30)

        print(f"Status code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            items = data.get("data", [])
            total = data.get("total", 0)

            print(f"\n✓ Successfully fetched anime!")
            print(f"Total available: {total}")
            print(f"Fetched: {len(items)}")

            if items:
                print(f"\nFirst anime: {items[0].get('title')}")
                print(f"ID: {items[0].get('id')}")

            return True
        else:
            print(f"\n✗ API request failed!")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"\n✗ Error during API request: {e}")
        return False


def main():
    print("="*60)
    print("Crunchyroll API Test")
    print("="*60 + "\n")

    # Get credentials from command line arguments or environment
    import os

    username = sys.argv[1] if len(sys.argv) > 1 else os.getenv('CRUNCHYROLL_USERNAME')
    password = sys.argv[2] if len(sys.argv) > 2 else os.getenv('CRUNCHYROLL_PASSWORD')

    if not username or not password:
        print("ERROR: Please provide credentials")
        print("\nUsage:")
        print("  python test_crunchyroll_api.py <username> <password>")
        print("  OR set CRUNCHYROLL_USERNAME and CRUNCHYROLL_PASSWORD env vars")
        sys.exit(1)

    # Test authentication
    access_token = test_authentication(username, password)

    if not access_token:
        print("\n✗ Authentication test failed")
        sys.exit(1)

    # Test browse API
    success = test_browse_api(access_token)

    if success:
        print("\n" + "="*60)
        print("✓ All tests passed! API access is working.")
        print("="*60)
    else:
        print("\n✗ Browse API test failed")
        sys.exit(1)


if __name__ == '__main__':
    main()
