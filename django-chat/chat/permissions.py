from .mongo_client import users_collection, conversations_collection
from bson.objectid import ObjectId

def check_chat_permission(sender_id, receiver_id):
    """
    Returns (Allowed: bool, ErrorMessage: str)
    """
    try:
        sender = users_collection.find_one({"_id": ObjectId(sender_id)})
        receiver = users_collection.find_one({"_id": ObjectId(receiver_id)})

        if not sender or not receiver:
            return False, "User not found"

        sender_role = sender.get('role', 'Employee')
        receiver_role = receiver.get('role', 'Employee')
        
        sender_dept = str(sender.get('department', ''))
        receiver_dept = str(receiver.get('department', ''))

        # Check if Conversation exists and is Disabled
        conversation = conversations_collection.find_one({
            "participants": {"$all": [sender_id, receiver_id]}
        })
        is_disabled = conversation.get('is_disabled', False) if conversation else False

        # --- ROLE BASED LOGIC ---

        # 1. ADMIN: Can message anyone, even if disabled (to have the last word)
        if sender_role == 'Admin':
            return True, None

        # 2. DEPARTMENT HEAD
        if sender_role == 'Department Head':
            # Can msg Admin (Always)
            if receiver_role == 'Admin':
                return True, None
            
            # Can msg Own Dept Employee
            if receiver_role in ['Employee', 'employee'] and sender_dept == receiver_dept:
                if is_disabled:
                    return False, "Chat is disabled."
                return True, None
            
            return False, "You can only message Admins or your Department's employees."

        # 3. EMPLOYEE
        if sender_role in ['Employee', 'employee']:
            # BLOCKED CHECK: If chat is disabled, Employee CANNOT message anyone
            if is_disabled:
                return False, "This chat has been disabled."

            # Can msg Own Dept Head
            if receiver_role == 'Department Head':
                if sender_dept == receiver_dept:
                    return True, None
                return False, "You can only message your own Department Head."

            # Can msg Admin (ONLY if conversation already exists - i.e., replying)
            if receiver_role == 'Admin':
                if conversation:
                    return True, None
                return False, "You cannot start a chat with an Admin. Wait for them to message you."

            return False, "Permission Denied."

        return False, "Permission Denied"

    except Exception as e:
        print(f"Permission Error: {e}")
        return False, "Server Error checking permissions"