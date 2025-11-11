from db_connection import get_db

db = get_db()

db.panelists_master.create_index("email", unique=True)
db.panelists_master.create_index([("active", 1)])
db.panelists_master.create_index([("name", 1)])
db.panelists_master.create_index([("department", 1)])