from django.urls import path
from .views import *

urlpatterns = [
    path('history/<str:user_id>', get_chat_history),
    path('recent/<str:user_id>', get_recent_chats),
    path('search', search_users),
    path('toggle', toggle_chat),
    path('delete_all', delete_conversation),
    path('message/<str:message_id>', manage_message),
    path('unread/total/<str:user_id>', get_total_unread),
]