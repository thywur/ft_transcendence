from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import MessageSerializer
from .models import Message
import chat.models as cmod
from .enums import MessageType
from datetime import datetime
import requests

class MessagesView(APIView):
    def get(self, request):
        messages = Message.objects.order_by("created_at").all()
        serializer = MessageSerializer(messages, many=True)
        message_history = []
        for message in serializer.data:
            formatted_time = datetime.strptime(message['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%H-%M")
            message_history.append({'type': MessageType.Chat.HISTORY, 'data': {
                'content': message['content'],
                'author': message['author'],
                'created_at': formatted_time
            }})
        return Response(message_history)
    
class FriendsView(APIView):
    def get(self, request):
        try:
            token = request.headers.get("Authorization").split(" ")[1]
            r = requests.get("http://auth:8001/user/me/", headers={"Authorization": f"Bearer {token}"})
            if r.status_code != 200:
                return Response("Invalid token", status=403)
            username = r.json()["username"]
            user = cmod.User.objects.get(username=username)
            if not user:
                return Response("User not found", status=404)
            print([str(username) for username in user.get_friends()], flush=True)
            return Response([str(username) for username in user.get_friends()])
        except AttributeError:
            return Response("No token provided", status=401)
        except Exception as e:
            return Response("An error occurred", status=500)
