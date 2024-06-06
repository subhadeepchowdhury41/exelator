import pandas as pd


df = pd.read_excel('uploads/final_master.xlsx', engine='openpyxl')

# print(df.columns[0])
print(df[df['instrument_token'] == pd.to_numeric('9464834', errors='coerce')])