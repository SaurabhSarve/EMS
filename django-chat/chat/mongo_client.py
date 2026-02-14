import os
from pymongo import MongoClient
from django.conf import settings
from bson.objectid import ObjectId

client = MongoClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

# Collections
messages_collection = db['messages']
users_collection = db['users'] 
conversations_collection = db['conversations'] 
departments_collection = db['departments']

# --- FIXED: Handle ALL ObjectId fields ---
def fix_id(doc):
    if not doc: return None
    # Loop through all fields and convert ObjectId to string
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc