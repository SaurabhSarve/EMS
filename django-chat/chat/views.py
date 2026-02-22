from rest_framework.decorators import api_view
from rest_framework.response import Response
from .mongo_client import messages_collection, users_collection, conversations_collection, departments_collection, fix_id
from bson.objectid import ObjectId
import re
import datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import jwt
import os
from django.conf import settings
from functools import wraps

# --- SECURITY MIDDLEWARE (DECORATOR) ---
def jwt_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            print("401: Missing or invalid Authorization header.")
            return Response({"error": "Unauthorized - Missing Token"}, status=401)

        token = auth_header.split(' ')[1].strip('"').strip("'")
        secret = settings.SECRET_KEY 
        
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            
            # FIX: Look for 'userId' first, which matches your Node.js authController
            token_user_id = str(payload.get('userId', payload.get('id', payload.get('_id'))))

            if token_user_id == 'None':
                print("401: Token missing user ID payload")
                return Response({"error": "Unauthorized - Invalid Token Payload"}, status=401)

            requested_user_id = kwargs.get('user_id') or request.GET.get('user_id') or request.data.get('admin_id')
            if requested_user_id and str(requested_user_id) != token_user_id:
                user = users_collection.find_one({"_id": ObjectId(token_user_id)})
                if not user or user.get('role') != 'Admin':
                    print(f"403: User {token_user_id} tried to access {requested_user_id}")
                    return Response({"error": "Forbidden - Access Denied"}, status=403)

            request.authenticated_user_id = token_user_id

        except jwt.ExpiredSignatureError:
            print("401: Token Expired")
            return Response({"error": "Unauthorized - Token Expired"}, status=401)
        except Exception as e:
            print(f"401: Token Invalid. Error: {str(e)}")
            return Response({"error": "Unauthorized - Invalid Token"}, status=401)

        return view_func(request, *args, **kwargs)
    return _wrapped_view

# --- HELPER: Fetch Department Name ---
def enrich_user(user_doc):
    if not user_doc: return None
    dept_id = user_doc.get('department')
    dept_name = ""
    if dept_id:
        try:
            dept_doc = departments_collection.find_one({"_id": ObjectId(dept_id)})
            if dept_doc:
                dept_name = dept_doc.get('name', '') 
        except: pass 
    user_doc['department_name'] = dept_name
    return fix_id(user_doc)

@api_view(['GET'])
@jwt_required
def get_recent_chats(request, user_id):
    # 1. Fetch Existing Conversations
    cursor = conversations_collection.find({"participants": user_id}).sort("updated_at", -1)
    results = []
    existing_partner_ids = set()

    for conv in cursor:
        other_id = conv['participants'][0] if conv['participants'][0] != user_id else conv['participants'][1]
        existing_partner_ids.add(other_id)
        user_doc = users_collection.find_one({"_id": ObjectId(other_id)}, {"password": 0, "AccessKey": 0})
        
        if user_doc:
            unread = messages_collection.count_documents({
                "sender_id": other_id,
                "receiver_id": user_id,
                "is_read": False,
                "deleted_by": {"$ne": user_id} 
            })
            
            results.append({
                "conversation_id": str(conv['_id']),
                "user": enrich_user(user_doc),
                "last_message": conv.get('last_message', ''),
                "updated_at": conv.get('updated_at'),
                "is_disabled": conv.get('is_disabled', False),
                "unread_count": unread
            })

    # 2. Auto-Populate Sidebar based on Role & Department (Robust ObjectId Check)
    try:
        current_user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        current_user = None
    
    if current_user:
        role = current_user.get('role')
        dept = current_user.get('department')

        # --- CRITICAL FIX: Match Department ID as both String AND ObjectId ---
        dept_query = dept
        if dept and ObjectId.is_valid(str(dept)):
             dept_query = {"$in": [ObjectId(str(dept)), str(dept)]}

        # --- LOGIC 1: Employee sees their Department Head(s) ---
        if role in ['Employee', 'employee'] and dept:
            # Fetch ALL Department Heads (Handles duplicates or co-heads)
            dept_heads = users_collection.find({
                "department": dept_query, 
                "role": "Department Head"
            }, {"password": 0, "AccessKey": 0})
            
            for head in dept_heads:
                head_id_str = str(head['_id'])
                # Only add if not already in conversation list and not self
                if head_id_str not in existing_partner_ids and head_id_str != user_id:
                    results.insert(0, {
                        "conversation_id": f"new_{head_id_str}",
                        "user": enrich_user(head),
                        "last_message": "Start conversation with Dept Head",
                        "updated_at": datetime.datetime.now().isoformat(),
                        "is_disabled": False,
                        "unread_count": 0
                    })

        # --- LOGIC 2: Dept Head sees ALL Employees in Dept ---
        elif role == 'Department Head' and dept:
            employees = users_collection.find({
                "department": dept_query,
                "role": {"$in": ["Employee", "employee"]}
            }, {"password": 0, "AccessKey": 0})

            for emp in employees:
                emp_id_str = str(emp['_id'])
                if emp_id_str not in existing_partner_ids and emp_id_str != user_id:
                    results.append({
                        "conversation_id": f"new_{emp_id_str}",
                        "user": enrich_user(emp),
                        "last_message": "Tap to chat",
                        "updated_at": datetime.datetime.now().isoformat(),
                        "is_disabled": False,
                        "unread_count": 0
                    })

    return Response(results)

@api_view(['GET'])
@jwt_required
def search_users(request):
    query = request.GET.get('q', '')
    current_user_id = request.GET.get('user_id')
    if not query or not current_user_id: return Response([])

    try:
        current_user = users_collection.find_one({"_id": ObjectId(current_user_id)})
    except:
        return Response([])
        
    if not current_user: return Response([])

    role = current_user.get('role', 'Employee')
    dept = current_user.get('department')
    
    # Robust Dept Query
    dept_query = dept
    if dept and ObjectId.is_valid(str(dept)):
         dept_query = {"$in": [ObjectId(str(dept)), str(dept)]}

    base_query = {
        "$or": [
            {"firstName": {"$regex": query, "$options": "i"}},
            {"lastName": {"$regex": query, "$options": "i"}},
            {"employeeId": {"$regex": query, "$options": "i"}}
        ],
        "_id": {"$ne": ObjectId(current_user_id)}
    }

    final_filter = {}
    if role == 'Admin': 
        final_filter = base_query
    elif role == 'Department Head':
        # Head can search: Admins OR their own Employees
        final_filter = {
            "$and": [
                base_query, 
                {"$or": [
                    {"role": "Admin"}, 
                    {"role": {"$in": ["Employee", "employee"]}, "department": dept_query}
                ]}
            ]
        }
    else: 
        # Employee can search: Admins OR their Department Heads
        final_filter = {
            "$and": [
                base_query, 
                {"$or": [
                    {"role": "Admin"}, 
                    {"role": "Department Head", "department": dept_query}
                ]}
            ]
        }

    projection = {"firstName": 1, "lastName": 1, "role": 1, "profilePhoto": 1, "email": 1, "department": 1, "employeeId": 1}
    cursor = users_collection.find(final_filter, projection).limit(10)
    users = [enrich_user(u) for u in cursor]
    return Response(users)

@api_view(['POST'])
@jwt_required
def toggle_chat(request):
    admin_id = request.data.get('admin_id') 
    target_user_id = request.data.get('target_user_id')
    action = request.data.get('action') 

    requester = users_collection.find_one({"_id": ObjectId(admin_id)})
    target = users_collection.find_one({"_id": ObjectId(target_user_id)})
    if not requester or not target: return Response({"error": "User not found"}, status=404)

    req_role = requester.get('role', 'Employee')
    target_role = target.get('role', 'Employee')
    req_dept = str(requester.get('department', ''))
    target_dept = str(target.get('department', ''))

    can_block = False
    if req_role == 'Admin': can_block = True 
    elif req_role == 'Department Head':
        if target_role == 'Admin': return Response({"error": "You cannot block an Admin"}, status=403)
        if target_role in ['Employee', 'employee'] and req_dept == target_dept: can_block = True
        else: return Response({"error": "You can only block employees in your department"}, status=403)
    else: return Response({"error": "Employees cannot disable chats"}, status=403)

    if can_block:
        is_disabled = (action == 'disable')
        conversations_collection.update_one(
            { "participants": { "$all": [admin_id, target_user_id] } },
            { "$set": { "is_disabled": is_disabled } },
            upsert=True
        )
        channel_layer = get_channel_layer()
        event = {"type": "chat_status_update", "is_disabled": is_disabled, "participants": [admin_id, target_user_id]}
        async_to_sync(channel_layer.group_send)(f"user_{target_user_id}", event)
        async_to_sync(channel_layer.group_send)(f"user_{admin_id}", event)
        return Response({"success": True, "status": action})

    return Response({"error": "Unauthorized"}, status=403)

# --- GET MESSAGES (UPDATED to return ID) ---
@api_view(['GET'])
@jwt_required
def get_chat_history(request, user_id):
    other_user_id = request.GET.get('other_user')
    if not other_user_id: return Response([], status=400)

    # Mark as READ (Only visible ones)
    messages_collection.update_many(
        {
            "sender_id": other_user_id, 
            "receiver_id": user_id, 
            "is_read": False,
            "deleted_by": {"$ne": user_id}
        },
        {"$set": {"is_read": True}}
    )

    conv = conversations_collection.find_one({
        "participants": { "$all": [user_id, other_user_id] }
    })
    is_disabled = conv.get('is_disabled', False) if conv else False

    # Fetch Messages NOT deleted by me
    query = {
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ],
        "deleted_by": {"$ne": user_id} # <--- SOFT DELETE FILTER
    }
    
    cursor = messages_collection.find(query).sort("timestamp", 1)
    results = []
    for doc in cursor:
        ts = doc['timestamp']
        if isinstance(ts, datetime.datetime):
            if ts.tzinfo is None: ts = ts.replace(tzinfo=datetime.timezone.utc)
            ts = ts.isoformat()
        results.append({
            "id": str(doc['_id']), 
            "sender": doc['sender_id'],
            "message": doc['message'],
            "timestamp": ts
        })

    return Response({
        "messages": results,
        "is_disabled": is_disabled
    })
    
@api_view(['GET'])
@jwt_required
def get_total_unread(request, user_id):
    """ API to get total unread messages for Dashboard Badge (Exclude deleted) """
    count = messages_collection.count_documents({
        "receiver_id": user_id,
        "is_read": False,
        "deleted_by": {"$ne": user_id}
    })
    return Response({"count": count})

# --- NEW: DELETE CONVERSATION ---
@api_view(['DELETE'])
@jwt_required
def delete_conversation(request):
    """ SOFT DELETE: Clear chat for requesting user only """
    user_id = request.GET.get('user_id')
    other_user_id = request.GET.get('other_user')

    if not user_id or not other_user_id:
        return Response({"error": "Missing parameters"}, status=400)

    # Add user_id to 'deleted_by' array instead of removing document
    messages_collection.update_many(
        {
            "$or": [
                {"sender_id": user_id, "receiver_id": other_user_id},
                {"sender_id": other_user_id, "receiver_id": user_id}
            ]
        },
        {"$addToSet": {"deleted_by": user_id}}
    )
    
    # We DO NOT clear the conversation 'last_message' because the other user still sees it.
    
    # Broadcast event to clear LOCAL screen only
    channel_layer = get_channel_layer()
    event = {
        "type": "chat_activity",
        "action": "clear_chat",
        "initiator_id": user_id, # Only clear for this user
        "participants": [user_id, other_user_id]
    }
    async_to_sync(channel_layer.group_send)(f"user_{user_id}", event)

    return Response({"success": True})

# --- NEW: EDIT/DELETE SINGLE MESSAGE ---
@api_view(['PUT', 'DELETE'])
@jwt_required
def manage_message(request, message_id):
    user_id = request.GET.get('user_id') # Auth check
    
    try:
        msg = messages_collection.find_one({"_id": ObjectId(message_id)})
    except:
        return Response({"error": "Invalid ID"}, status=400)

    if not msg: return Response({"error": "Message not found"}, status=404)

    # Only sender can edit/delete
    if msg['sender_id'] != user_id:
        return Response({"error": "Unauthorized"}, status=403)

    channel_layer = get_channel_layer()
    receiver_id = msg['receiver_id']

    if request.method == 'DELETE':
        messages_collection.delete_one({"_id": ObjectId(message_id)})
        
        # Broadcast Delete
        event = {
            "type": "chat_activity",
            "action": "delete_message",
            "message_id": message_id
        }
        async_to_sync(channel_layer.group_send)(f"user_{receiver_id}", event)
        async_to_sync(channel_layer.group_send)(f"user_{user_id}", event)

    elif request.method == 'PUT':
        new_text = request.data.get('message')
        if not new_text: return Response({"error": "Empty message"}, status=400)
        
        messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"message": new_text}}
        )

        # Broadcast Edit
        event = {
            "type": "chat_activity",
            "action": "edit_message",
            "message_id": message_id,
            "new_text": new_text
        }
        async_to_sync(channel_layer.group_send)(f"user_{receiver_id}", event)
        async_to_sync(channel_layer.group_send)(f"user_{user_id}", event)

    return Response({"success": True})