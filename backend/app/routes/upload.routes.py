import os
from flask import Config, app, jsonify, request
import pandas as pd

from . import upload_bp

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    print('ljljl')
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    filename = os.path.join(Config.UPLOAD_FOLDER, file.filename)
    file.save(filename)
    return jsonify({"filename": file.filename}), 200

@upload_bp.route('/update_row', methods=['POST'])
def update_row():
    data = request.json
    filename = data['filename']
    unique_col_index = data['uniqueColIndex']
    
    updated_row = data['updatedRow']
    
    row_id = data['column_' + unique_col_index]
    
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
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
