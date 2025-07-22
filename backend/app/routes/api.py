from flask import jsonify, request
from app import app
from app.models import User, db
from app.services.chat_service import ChatService
from app.utils.decorators import authenticate_user
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

