from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Database connection
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "generator_ops"
DB_USER = "gen_user"
DB_PASSWORD = "secure_password_here"

# JWT secret
JWT_SECRET = "your_secret_key_change_this"
JWT_EXPIRY = 24  # hours

def get_db():
    """Get database connection"""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cur = conn.cursor()
    
    # Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tasks table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            building_name VARCHAR(255),
            generator_id VARCHAR(255),
            task_title VARCHAR(255),
            task_description TEXT,
            due_date DATE,
            status VARCHAR(50) DEFAULT 'Current',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()

# Initialize database on startup
try:
    init_db()
except Exception as e:
    print(f"Database init error: {e}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "generator-ops-backend"})

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        conn = get_db()
        cur = conn.cursor()
        
        try:
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (username, email, password_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            
            # Generate JWT token
            token = jwt.encode(
                {
                    'user_id': user_id,
                    'username': username,
                    'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY)
                },
                JWT_SECRET,
                algorithm='HS256'
            )
            
            return jsonify({
                "status": "success",
                "user_id": user_id,
                "username": username,
                "token": token
            }), 201
        except psycopg2.IntegrityError:
            conn.rollback()
            return jsonify({"error": "Username or email already exists"}), 409
        finally:
            cur.close()
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({"error": "Missing username or password"}), 400
        
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Generate JWT token
        token = jwt.encode(
            {
                'user_id': user['id'],
                'username': user['username'],
                'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY)
            },
            JWT_SECRET,
            algorithm='HS256'
        )
        
        return jsonify({
            "status": "success",
            "user_id": user['id'],
            "username": user['username'],
            "token": token
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks for authenticated user"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_token(token)
        
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = payload['user_id']
        
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM tasks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        tasks = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({"tasks": tasks}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_token(token)
        
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = payload['user_id']
        data = request.json
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute(
            """INSERT INTO tasks 
            (user_id, building_name, generator_id, task_title, task_description, due_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id""",
            (user_id, data.get('building_name'), data.get('generator_id'), 
             data.get('task_title'), data.get('task_description'), 
             data.get('due_date'), data.get('status', 'Current'))
        )
        task_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"status": "success", "task_id": task_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_token(token)
        
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = payload['user_id']
        data = request.json
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute(
            """UPDATE tasks 
            SET building_name = %s, generator_id = %s, task_title = %s, 
                task_description = %s, due_date = %s, status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s""",
            (data.get('building_name'), data.get('generator_id'), data.get('task_title'),
             data.get('task_description'), data.get('due_date'), data.get('status'),
             task_id, user_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = verify_token(token)
        
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = payload['user_id']
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 Generator Ops Backend Starting")
    print("=" * 70)
    print("📍 Server: http://localhost:5002")
    print("📍 API: http://localhost:5002/api")
    print("")
    print("Endpoints:")
    print("  POST   /api/register - Register new user")
    print("  POST   /api/login - Login user")
    print("  GET    /api/tasks - Get user's tasks")
    print("  POST   /api/tasks - Create task")
    print("  PUT    /api/tasks/<id> - Update task")
    print("  DELETE /api/tasks/<id> - Delete task")
    print("=" * 70)
    app.run(host='0.0.0.0', port=5002, debug=False)
