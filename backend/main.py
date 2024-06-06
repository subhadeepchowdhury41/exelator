from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

clients = []


@app.route('/')
def index():
    return "Server is running!"


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)
    return jsonify({"filename": file.filename}), 200


@app.route('/update_row', methods=['POST'])
def update_row():
    data = request.json
    filename = data['filename']
    row_id = data['rowId']
    updated_row = data['updatedRow']

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    try:
        df = pd.read_excel(filepath, engine='openpyxl')
    except Exception as e:
        return str(e), 400

    try:
        for key, value in updated_row.items():
            column_name = key.replace("column_", "")
            df.at[int(row_id), column_name] = value

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
def handle_update_rows(data):
    emit('receiveUpdateRows', data, broadcast=True)
    update_file_with_changes(data, 'update')

@socketio.on('addRows')
def handle_add_rows(data):
    emit('receiveAddRows', data, broadcast=True)
    update_file_with_changes(data, 'add')


@socketio.on('deleteRows')
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
            print(row)
            row_id = row['id']
            for key, value in row.items():
                column_name = key.replace("column_", "")
                df.at[int(row_id), column_name] = value
    elif change_type == 'add':
        new_rows = pd.DataFrame(data['rows'])
        df = pd.concat([df, new_rows], ignore_index=True)
    elif change_type == 'delete':
        for row in data['rows']:
            row_id = row['id']
            df.drop(index=int(row_id), inplace=True)

    df.to_excel(filepath, index=False, engine='openpyxl')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
