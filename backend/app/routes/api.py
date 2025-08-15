from flask import jsonify, request
from app import app
from app.models import User, db
from app.services.chat_service import ChatService
from app.services.auth_service import AuthService
from app.utils.decorators import authenticate_user, jwt_required
from sqlalchemy import select

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
    """Send a message to another user"""
    try:
        data = request.get_json()
        recipient_id = data.get('recipient_id')
        content = data.get('content')
        message_type = data.get('message_type', 'text')
        
        if not recipient_id or not content:
            return jsonify({"error": "Recipient ID and content are required"}), 400
            
        message = ChatService.send_message(request.jwt_user.id, recipient_id, content, message_type)
        
        if message:
            return jsonify({
                "success": True,
                "message_id": message.id,
                "timestamp": message.created_at.isoformat()
            })
        else:
            return jsonify({"error": "Failed to send message"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/search', methods=['GET'])
@jwt_required
def search_chat_users():
    """Search for users to start conversations"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])
            
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