from flask import jsonify, request
from app import app
from app.models import User, MessageStatus, db
from app.services.chat_service import ChatService
from app.services.auth_service import AuthService
from app.services.message_queue_service import get_message_queue_service
from app.services.matching_service import MatchingService
from app.services.activity_service import ActivityService
from app.utils.decorators import authenticate_user, jwt_required
from sqlalchemy import select
from sqlalchemy import func, and_
import json

@app.route("/")
def hello():
    return jsonify({"message": "Hello from Flask!"})

@app.route("/api/conversations", methods=['POST'])
@authenticate_user
def get_user_conversations():
    try:
        data = request.get_json()
        user_id = data['userId']
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        conversations = ChatService.get_user_conversations(user_id)
        
        conversation_list = []
        for conv in conversations:
            # Determine who is the other person in the conversation
            other_user = conv.receiver if conv.sender_id == user_id else conv.sender
            
            conversation_data = {
                "id": conv.id,
                "other_user_id": other_user.id,
                "other_user_username": other_user.username,
                "sender_id": conv.sender_id,
                "receiver_id": conv.receiver_id
            }
            conversation_list.append(conversation_data)
        
        return jsonify({
            "user_id": user_id,
            "username": user.username,
            "conversations": conversation_list
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/conversations/messages", methods=['POST'])
@authenticate_user
def get_conversation_messages():
    """Get all messages in a specific conversation (user must have access)"""
    try:
        data = request.get_json()
        user_id = data['userId']
        
        if 'conversation_id' not in data:
            return jsonify({"error": "conversation_id is required"}), 400
        
        conversation_id = data['conversation_id']
        
        user_conversations = ChatService.get_user_conversations(user_id)
        conversation_ids = [conv.id for conv in user_conversations]
        
        if conversation_id not in conversation_ids:
            return jsonify({"error": "Access denied: You don't have access to this conversation"}), 403
        
        messages = ChatService.get_conversation_messages(conversation_id)
        
        if not messages:
            return jsonify({"error": "Conversation not found or no messages"}), 404
        
        # Format response using relationships instead of IDs
        message_list = []
        for message in messages:
            message_data = {
                "id": message.id,
                "conversation_id": message.conversation.id,
                "sender_username": message.sender.username,
                "sender_id": message.sender.id,
                "content": message.content,
                "message_type": message.message_type,
                "created_at": message.created_at.isoformat(),
                "status": message.status.status if message.status else "sent"
            }
            message_list.append(message_data)
        
        return jsonify({
            "conversation_id": conversation_id,
            "messages": message_list
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/messages", methods=['POST'])
@authenticate_user
def get_message():
    """Get a specific message by ID (user must have access)"""
    try:
        data = request.get_json()
        user_id = data['userId']
        
        if 'message_id' not in data:
            return jsonify({"error": "message_id is required"}), 400
        
        message_id = data['message_id']
        
        from app.models import Messages
        
        message = db.session.get(Messages, message_id)
        
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        user_conversations = ChatService.get_user_conversations(user_id)
        conversation_ids = [conv.id for conv in user_conversations]
        
        if message.conversation.id not in conversation_ids:
            return jsonify({"error": "Access denied: You don't have access to this message"}), 403
        
        # Use relationships instead of IDs
        message_data = {
            "id": message.id,
            "conversation_id": message.conversation.id,
            "sender_username": message.sender.username,
            "sender_id": message.sender.id,
            "content": message.content,
            "message_type": message.message_type,
            "created_at": message.created_at.isoformat(),
            "status": message.status.status if message.status else "sent"
        }
        
        return jsonify({"message": message_data})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/messages/send", methods=['POST'])
@authenticate_user
def send_message():
    try:
        data = request.get_json()
        sender_id = data['userId']
        
        if 'receiver_id' not in data:
            return jsonify({"error": "receiver_id is required"}), 400
        if 'content' not in data:
            return jsonify({"error": "content is required"}), 400
        
        receiver_id = data['receiver_id']
        content = data['content']
        message_type = data.get('message_type', 'text')
        
        receiver = db.session.get(User, receiver_id)
        if not receiver:
            return jsonify({"error": "Receiver not found"}), 404
        
        message = ChatService.send_message(sender_id, receiver_id, content, message_type)
        
        message_data = {
            "id": message.id,
            "conversation_id": message.conversation.id,
            "sender_username": message.sender.username,
            "sender_id": message.sender.id,
            "content": message.content,
            "message_type": message.message_type,
            "created_at": message.created_at.isoformat(),
            "status": message.status.status if message.status else "sent"
        }
        
        return jsonify({
            "success": True,
            "message": message_data
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# JWT-based chat routes (moved from chat.py)
@app.route('/api/chat/contacts', methods=['GET'])
@jwt_required
def get_chat_contacts():
    """Get user's chat contacts with latest messages"""
    try:
        user_id = request.jwt_user.id
        contacts = ChatService.get_user_contacts_with_details(user_id)
        return jsonify(contacts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/unread-count', methods=['GET'])
@jwt_required
def get_unread_message_count():
    """Get total unread 1-to-1 message count for current user."""
    try:
        user_id = request.jwt_user.id

        count = (
            db.session.execute(
                select(func.count(MessageStatus.id)).where(
                    and_(
                        MessageStatus.recipient_id == user_id,
                        MessageStatus.status.in_(["sent", "delivered"]),
                    )
                )
            ).scalar()
            or 0
        )

        return jsonify({"count": int(count)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/conversation/<int:user_id>', methods=['GET'])
@jwt_required
def get_chat_conversation(user_id):
    """Get conversation messages with a specific user"""
    try:
        current_user_id = request.jwt_user.id
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        messages = ChatService.get_conversation_messages_formatted(
            current_user_id, user_id, page, per_page
        )
        return jsonify(messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/conversation/<int:user_id>/read', methods=['POST'])
@jwt_required
def mark_chat_conversation_read(user_id: int):
    """Mark all unread messages from a specific user as read."""
    try:
        current_user_id = request.jwt_user.id
        conversation = ChatService.get_or_create_conversation(current_user_id, user_id)
        ChatService.mark_conversation_messages_as_read(conversation.id, current_user_id)
        return jsonify({
            "success": True,
            "conversation_id": conversation.id,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/profile/<int:user_id>', methods=['GET'])
@jwt_required
def get_chat_user_profile(user_id):
    """Get user profile for chat"""
    try:
        user = AuthService.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        profile_data = user.to_dict(include_private=False)
        profile_data["last_online"] = user.last_seen.isoformat() if user.last_seen else None
        
        return jsonify(profile_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/send', methods=['POST'])
@jwt_required
def send_chat_message():
    """
    Send a message to another user
    Backend handles encryption, queuing, and retry logic
    """
    try:
        data = request.get_json()
        recipient_id = data.get('recipient_id') or data.get('receiver_id')  # Support both keys
        content = data.get('content')
        message_type = data.get('message_type', 'text')
        client_id = data.get('client_id')
        
        if not recipient_id or not content:
            return jsonify({"error": "Recipient ID and content are required"}), 400
        
        recipient_id = int(recipient_id)
        
        # Get or create conversation
        conversation = ChatService.get_or_create_conversation(
            request.jwt_user.id,
            recipient_id
        )
        
        # Try immediate delivery (if user is online)
        from app.websocket.redis_manager import redis_manager
        is_online = redis_manager.is_user_online(recipient_id)
        
        if is_online:
            # Save to database immediately
            message = ChatService.send_message(
                request.jwt_user.id,
                recipient_id,
                content,
                message_type,
                client_id=client_id,
                mark_delivered=True,
            )
            
            # Send via WebSocket (best-effort)
            try:
                from app.websocket.server import schedule_send_to_user
                sender_pfp = request.jwt_user.profile_pic or "/avatars/male_avatar.png"

                schedule_send_to_user(
                    recipient_id,
                    {
                        "type": "new_message",
                        "data": {
                            "id": message.id,
                            "sender_id": request.jwt_user.id,
                            "recipient_id": recipient_id,
                            "conversation_id": message.conversation_id,
                            "content": message.content,
                            "created_at": message.created_at.isoformat(),
                            "message_type": message.message_type,
                            "pfp": sender_pfp,
                        },
                    },
                )
            except Exception as e:
                print(f"WebSocket delivery failed: {e}")
                # Message is queued, will retry
            
            return jsonify({
                "success": True,
                "message_id": message.id,
                "timestamp": message.created_at.isoformat(),
                "status": "delivered",
                "client_id": client_id,
            })
        else:
            # User offline - message is queued and will be retried
            queue_service = get_message_queue_service()
            message_queue_id = queue_service.queue_message(
                sender_id=request.jwt_user.id,
                recipient_id=recipient_id,
                content=content,
                conversation_id=conversation.id,
                message_type=message_type,
                is_room=False,
                client_id=client_id,
            )
            return jsonify({
                "success": True,
                "message_queue_id": message_queue_id,
                "status": "queued",
                "message": "Recipient offline. Message queued for delivery.",
                "client_id": client_id,
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/search', methods=['GET'])
@jwt_required
def search_chat_users():
    """Search for users to start conversations"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            results = ChatService.suggest_users(request.jwt_user.id)
            return jsonify(results)

        results = ChatService.search_users(query, request.jwt_user.id)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/online-users', methods=['GET'])
@jwt_required
def get_chat_online_users():
    """Get list of online users from contacts"""
    try:
        online_users = ChatService.get_online_contacts(request.jwt_user.id)
        return jsonify(online_users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/quiz/answers', methods=['POST'])
@jwt_required
def save_quiz_answers():
    """Save quiz answers for the current user (used by matchmaking).

    Expected body: { "answers": {"1": 2, "2": 4, ...} }
    """
    try:
        data = request.get_json() or {}
        answers = data.get('answers')
        if not isinstance(answers, dict):
            return jsonify({"error": "answers must be an object"}), 400

        user = db.session.get(User, request.jwt_user.id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.quiz_answers = json.dumps(answers)
        db.session.commit()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/find/matches', methods=['GET'])
@jwt_required
def get_find_matches():
    """Return deterministic, explainable matches for the Find tab."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = max(1, min(limit, 50))
        results = MatchingService.get_matches_for_user(request.jwt_user.id, limit=limit)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/activity', methods=['GET'])
@jwt_required
def get_activity_notifications():
    """Return a lightweight activity feed for the current user."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = max(1, min(limit, 50))
        notifications = ActivityService.get_notifications(request.jwt_user.id, limit=limit)
        return jsonify({"notifications": notifications})
    except Exception as e:
        return jsonify({"error": str(e)}), 500