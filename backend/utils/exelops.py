import os

import pandas as pd

from app.config import Config


def update_file_with_changes(data, change_type):
    filename = data['filename']
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    try:
        df = pd.read_excel(filepath, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    unique_col = data['uniqueColIndex']
    if change_type == 'update':
        for row in data['rows']:
            row_id = row['column_' + unique_col]
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

