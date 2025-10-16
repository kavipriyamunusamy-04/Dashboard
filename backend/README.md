# Authentication Backend (Flask + SQLite)

## Setup

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask server:**
   ```bash
   python app.py
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- **POST** `/api/auth/signup` - Register a new user
- **POST** `/api/auth/signin` - Login existing user
- **GET** `/api/auth/verify` - Verify token and get user data
- **GET** `/api/auth/users` - Get all users (requires token)
- **GET** `/health` - Health check

## Database

SQLite database file: `users.db`

### Users Table Schema:

- `id` - Integer (Primary Key, Auto Increment)
- `username` - Text (Unique, Not Null)
- `email` - Text (Unique, Not Null)
- `password_hash` - Text (Not Null)
- `full_name` - Text
- `created_at` - Timestamp (Default: Current Timestamp)

## Security

- Passwords are hashed using Werkzeug's `generate_password_hash`
- JWT tokens are used for authentication
- Tokens expire after 7 days
- CORS enabled for React frontend
