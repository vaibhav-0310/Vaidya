import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        {
            content: "Hi there! I'm your PawVadiya assistant. I'm here to help with pet care, veterinary services, and pet adoption. How can I assist you today? 🐾",
            isUser: false,
            timestamp: new Date(),
            isService: true
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

   
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const getGeminiResponse = async (userMessage) => {
         try {
            const response = await axios.post('/api/gemini-chat', {
                message: userMessage
            });
            return response.data.response; 
        } catch (error) {
            console.error("Error communicating with backend/Gemini:", error);
            const errorMessage = error.response?.data?.error || error.message;
            return `Oops! I'm having trouble connecting to my brain right now: ${errorMessage}. Please ensure the backend server is running correctly, or try again later.`;
        }
            
    };

    const sendMessage = async () => {
        if (inputMessage.trim() === '') return; 
        const newUserMessage = {
            content: inputMessage.trim(),
            isUser: true,
            timestamp: new Date()
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInputMessage('');
        setIsTyping(true); 

     
        const botResponseContent = await getGeminiResponse(newUserMessage.content);

    
        setTimeout(() => {
            const newBotMessage = {
                content: botResponseContent,
                isUser: false,
                timestamp: new Date(),
                isService: true
            };
        
            setMessages((prevMessages) => [...prevMessages, newBotMessage]);
            setIsTyping(false); 
        }, 1000 + Math.random() * 500);
    };
    const sendQuickMessage = (message) => {
        setInputMessage(message); 
       
        setTimeout(() => sendMessage(), 50); 
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chat-header">
                <h1>PawVadiya Assistant</h1>
                <p>Your friendly pet care companion</p>
            </div>

            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                        <div className="avatar">{msg.isUser ? '👤' : '🐕'}</div>
                        <div className="message-content">
                            {msg.content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="typing-indicator">
                        PawVadiya is typing
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} /> 
            </div>

            <div className="quick-actions">
                <div className="quick-buttons">
                    
                    <button className="quick-btn" onClick={() => sendQuickMessage('Tell me about pet care tips.')}>🏥 Pet Care</button>
                    <button className="quick-btn" onClick={() => sendQuickMessage('What veterinary services do you offer?')}>🩺 Vet Services</button>
                    <button className="quick-btn" onClick={() => sendQuickMessage('How can I adopt a pet?')}>🏠 Adoption</button>
                    <button className="quick-btn" onClick={() => sendQuickMessage('I have a pet emergency, what should I do?')}>🚨 Emergency</button>
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask me anything about pets..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping} 
                    />
                    <button className="send-btn" onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
