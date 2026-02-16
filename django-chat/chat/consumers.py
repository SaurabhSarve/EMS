import json
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from .mongo_client import messages_collection, conversations_collection
from .permissions import check_chat_permission

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not getattr(user, 'is_authenticated', False):
            await self.close()
            return

        self.user_id = user.id
        self.room_group_name = f"user_{self.user_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data['message']
        receiver_id = data['receiverId']

        is_allowed, error_msg = check_chat_permission(self.user_id, receiver_id)
        if not is_allowed:
            await self.send(text_data=json.dumps({"error": error_msg, "type": "error"}))
            return

        now_aware = datetime.datetime.now(datetime.timezone.utc)
        
        msg_doc = {
            "sender_id": self.user_id,
            "receiver_id": receiver_id,
            "message": message_text,
            "timestamp": now_aware,
            "is_read": False,
            "deleted_by": [] # --- Initialize Empty Array ---
        }
        
        result = messages_collection.insert_one(msg_doc)
        msg_id = str(result.inserted_id)

        query = { "participants": { "$all": [self.user_id, receiver_id] } }
        conversation = conversations_collection.find_one(query)
        if conversation:
            conversations_collection.update_one(
                { "_id": conversation["_id"] },
                { "$set": { "last_message": message_text, "updated_at": now_aware } }
            )
        else:
            conversations_collection.insert_one({
                "participants": [self.user_id, receiver_id],
                "last_message": message_text,
                "updated_at": now_aware,
                "is_disabled": False
            })

        payload = {
            "id": msg_id, 
            "sender_id": self.user_id,
            "receiver_id": receiver_id,
            "message": message_text,
            "timestamp": now_aware.isoformat()
        }

        await self.channel_layer.group_send(
            f"user_{receiver_id}",
            {"type": "chat_message", "message": payload}
        )
        await self.send(text_data=json.dumps(payload))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def chat_status_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "status_update",
            "is_disabled": event["is_disabled"],
            "participants": event["participants"]
        }))

    async def chat_activity(self, event):
        await self.send(text_data=json.dumps({
            "type": "activity",
            "action": event["action"],
            "initiator_id": event.get("initiator_id"), # Added for clear_chat logic
            "message_id": event.get("message_id"),
            "new_text": event.get("new_text"),
            "participants": event.get("participants")
        }))