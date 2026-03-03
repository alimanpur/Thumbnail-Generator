import httpx
import asyncio
import json

async def main():
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "title": "Why Python Will Dominate AI in 2025",
                "style": "Cyberpunk"
            }
            print(f"Sending request: {json.dumps(payload, indent=2)}")
            
            response = await client.post('http://localhost:8000/api/generate', json=payload, timeout=60.0)
            
            print(f"Status: {response.status_code}")
            try:
                data = response.json()
                print(f"Success: {data.get('success')}")
                print(f"Short Title: {data.get('short_title')}")
                print(f"Highlight Word: {data.get('highlight_word')}")
                print(f"Image URL Length: {len(data.get('image_url', ''))}")
            except Exception as parse_e:
                print(f"Could not parse JSON: {parse_e}")
                print(f"Raw body: {response.text[:500]}...")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == '__main__':
    asyncio.run(main())
