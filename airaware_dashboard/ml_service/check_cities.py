import pandas as pd

df = pd.read_csv('city_hour_final.csv')
cities = sorted(df['City'].unique())
print(f'Total cities: {len(cities)}')
print('\nAvailable cities:')
for c in cities:
    print(f'  - {c}')
