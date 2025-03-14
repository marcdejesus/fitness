import requests

BASE_URL = "http://localhost:8000/api"

def test_auth_flow():
    # 1. Register user
    register_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "display_name": "New User"
    }
    
    print("Registering user...")
    reg_response = requests.post(f"{BASE_URL}/auth/register/", json=register_data)
    print(f"Registration response: {reg_response.status_code}")
    print(reg_response.json())
    
    # 2. Login
    login_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!"
    }
    
    print("\nLogging in...")
    login_response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    print(f"Login response: {login_response.status_code}")
    
    if login_response.status_code == 200:
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # 3. Access protected endpoint
        print("\nAccessing protected endpoint...")
        auth_header = {"Authorization": f"Bearer {access_token}"}
        test_response = requests.get(f"{BASE_URL}/auth/test/", headers=auth_header)
        print(f"Protected endpoint response: {test_response.status_code}")
        print(test_response.json())
    else:
        print("Login failed")
        print(login_response.json())

if __name__ == "__main__":
    test_auth_flow()