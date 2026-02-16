import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from .mongo_client import users_collection
from bson.objectid import ObjectId

@database_sync_to_async
def get_user(user_id):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            # Create a simple object to mimic a Django User
            # This is enough for the consumer to check is_authenticated
            class MongoUser:
                is_authenticated = True
                id = str(user['_id'])
                username = user.get('email')
                role = user.get('role')
            return MongoUser()
        return AnonymousUser()
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # 1. Get the token from query string
        query_string = parse_qs(scope["query_string"].decode("utf8"))
        token = query_string.get("token")

        if token:
            try:
                # 2. Decode the token
                # NOTE: Ensure 'settings.SECRET_KEY' matches your Node.js JWT Secret
                # If Node uses a different secret, hardcode it here for now:
                # secret = "your_node_jwt_secret"
                payload = jwt.decode(token[0], settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("id") or payload.get("userId") or payload.get("_id")
                
                # 3. Get User from DB
                scope["user"] = await get_user(user_id)
            except Exception as e:
                print(f"JWT Error: {e}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)