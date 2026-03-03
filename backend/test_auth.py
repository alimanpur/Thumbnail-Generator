import httpx
import asyncio

async def main():
    try:
        async with httpx.AsyncClient() as client:
            print("--- Registering User ---")
            reg_resp = await client.post('http://localhost:8000/api/auth/register', json={"email": "test@example.com", "password": "password123"})
            print(f"Status: {reg_resp.status_code}, Body: {reg_resp.text}")

            print("\n--- Logging In ---")
            login_resp = await client.post('http://localhost:8000/api/auth/login', data={"username": "test@example.com", "password": "password123"})
            print(f"Status: {login_resp.status_code}, Body: {login_resp.text}")
            
            if login_resp.status_code == 200:
                token = login_resp.json().get('access_token')
                
                print("\n--- Generating Thumbnail (Authenticated) ---")
                gen_resp = await client.post(
                    'http://localhost:8000/api/generate', 
                    json={"title": "Testing Profiles", "style": "Minimalist"},
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=30.0
                )
                print(f"Gen Status: {gen_resp.status_code}, Image Generated: {gen_resp.json().get('success')}")
                
                print("\n--- Fetching Profile Thumbnails ---")
                prof_resp = await client.get(
                    'http://localhost:8000/api/profile/thumbnails',
                    headers={"Authorization": f"Bearer {token}"}
                )
                print(f"Profile Status: {prof_resp.status_code}, Count: {len(prof_resp.json())}")

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
