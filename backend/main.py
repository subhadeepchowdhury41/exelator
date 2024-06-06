from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import pandas as pd

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'subha123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

jwt = JWTManager(app)
db = SQLAlchemy(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

clients = []

# Define User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return "Server is running!"

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"msg": "Bad username or password"}), 401

    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

@app.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)
    return jsonify({"filename": file.filename}), 200

@app.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    return jsonify({"user": current_user_id}), 200

@app.route('/update_row', methods=['POST'])
@jwt_required()
def update_row():
    data = request.json
    filename = data['filename']
    row_id = data['updatedRow']['column_'+ str(data['uniqueColIndex'])]
    updated_row = data['updatedRow']
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    print("ROW_ID", row_id)
    print("UPDATED_ROW", updated_row)
    try:
        df = pd.read_excel(filepath, engine='openpyxl')
    except Exception as e:
        return str(e), 400
    new_row_dict = {}
    try:
        for key, value in updated_row.items():
            if key == 'id':
                continue
            column_name = df.columns[int(key.replace("column_", ""))]
            df.loc[df[df.columns[data['uniqueColIndex']]] == row_id, column_name] = pd.to_numeric(value,errors='coerce')
        df.to_excel(filepath, index=False, engine='openpyxl')
        return "Row updated successfully", 200
    except Exception as e:
        print(e)
        return str(e), 400

@socketio.on('connect')
def handle_connect():
    clients.append(request.sid)
    print(f"Client {request.sid} connected")

@socketio.on('disconnect')
def handle_disconnect():
    clients.remove(request.sid)
    print(f"Client {request.sid} disconnected")

@socketio.on('updateRows')
@jwt_required()
def handle_update_rows(data):
    emit('receiveUpdateRows', data, broadcast=True)
    update_file_with_changes(data, 'update')

@socketio.on('addRows')
@jwt_required()
def handle_add_rows(data):
    emit('receiveAddRows', data, broadcast=True)
    update_file_with_changes(data, 'add')

@socketio.on('deleteRows')
@jwt_required()
def handle_delete_rows(data):
    emit('receiveDeleteRows', data, broadcast=True)
    update_file_with_changes(data, 'delete')

def update_file_with_changes(data, change_type):
    filename = data['filename']
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    try:
        df = pd.read_excel(filepath, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    if change_type == 'update':
        for row in data['rows']:
            row_id = row['column_' + str(data['uniqueColIndex'])]
            for key, value in row.items():
                if key == 'id':
                    continue
                column_name = df.columns[int(key.replace("column_", ""))]
                df.loc[df[df.columns[data['uniqueColIndex']]] == row_id, column_name] = pd.to_numeric(value,errors='coerce')
    elif change_type == 'add':
        new_rows = pd.DataFrame(data['rows'])
        df = pd.concat([df, new_rows], ignore_index=True)
    elif change_type == 'delete':
        for row in data['rows']:
            row_id = row['column_' + str(data['uniqueColIndex'])]
            df.drop(index=int(row_id), inplace=True)

    df.to_excel(filepath, index=False, engine='openpyxl')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
