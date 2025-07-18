from collections import defaultdict

def group_columns_by_table(schema_metadata):
    grouped = defaultdict(list)
    for column in schema_metadata:
        table = column['table_name']
        column_info = {key: column[key] for key in column if key != 'table_name'}
        grouped[table].append(column_info)
    return dict(grouped)
