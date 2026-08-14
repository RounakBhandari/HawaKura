import React, { useEffect, useRef, useState } from 'react'
import { useChatState } from '../../context/ChatProvider'
import io from 'socket.io-client';
import API from '../../config/api';
const ENDPOINT = 'http://localhost:5000';
let socket;

export const SingleChat = ({partner}) => {
    const { user, selectedChat } = useChatState();
    const [ messages, setMessages ]  = useState([]);
    const [ newMessage, setNewMessage ] = useState('');
    const [ socketConnected, setSocketConnected ] = useState(false);

    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ pendingCapsuleMessage, setPendingCapsuleMessage ] = useState('');

    const messageEndRef = useRef(null);
    const scrollToBottom = () =>{
        messageEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }

    useEffect(() =>{
        socket = io(ENDPOINT);
        socket.emit('setup', user);
        socket.on('connected', ()=> getSocketConected(true));

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(()=>{
        const fetchMessages = async () =>{
            if(!selectedChat) return;
            try {
                const { data } = await API.get(`/api/messages/${selectedChat._id}`);
                setMessages(data);
                socket.emit('join chat', selectedChat._id);
            } catch (error) {
                console.error('Failed to fetch messages: ', error);
            }
        }
        fetchMessages();

    }, [selectedChat]);

    useEffect(()=>{
        socket.on('message received', (newMessageRecieved) =>{
            if(!selectedChat || selectedChat._id !== newMessageRecieved.chat._id){
                // Showing notificationss normally for other chats. need to modify it later. 
            }
            else{
                setMessages([...messages, newMessageRecieved]);
            }
        });
        return ()=> socket.off('message received');
    });

    useEffect(()=>{
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e, scheduledFor = null) =>{
        if (e) e.preventDefault();

        const messageContent = scheduledFor ? pendingCapsuleMessage : newMessage;
        if(!messageContent.trim()) return;

        try {
            setNewMessage('');
            setPendingCapsuleMessage('');

            const {data} = await API.post('/api/messages', {
                content: messageContent,
                chatId: selectedChat._id,
                isTimeCapsule: !!scheduledFor,
                unlockDate: scheduledFor,
            });
            socket.emti('new message', data);
            setMessages([...messages, data]);

        } catch (error) {
            console.error('Failed to send message', error);
        }
    }

    const handleTimeCapusleTrigger = (e) => {
        e.preventDefault();
        if(!newMessage.trim()) return;
        setPendingCapsuleMessage(newMessage);
        setIsModalOpen(true);
    };



  return (
    <div className="flex flex-col h-full bg-slate-950/50 relative">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isSender = m.sender._id === user._id;
          const isLocked = m.isTimeCapsule && new Date(m.unlockDate) > new Date();

          return (
            <div key={m._id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isLocked
                    ? 'bg-slate-900 border border-slate-700 text-slate-500 italic'
                    : isSender
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}
              >
                {isLocked ? (
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="animate-pulse">🔒</span> Locked until {new Date(m.unlockDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={(e) => sendMessage(e)} className="flex items-center gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-12"
          />
          
          {/* Time Capsule Trigger inside input field */}
          <button
            type="button"
            onClick={handleTimeCapsuleTrigger}
            className="absolute right-16 hover:scale-110 transition-transform p-2 text-slate-400 hover:text-indigo-400"
            title="Make this a Time Capsule message"
          >
            ⏳
          </button>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            Send
          </button>
        </form>
      </div>

      <TimeCapsuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={(date) => sendMessage(null, date)}
        partnerName={partner?.username}
      />
    </div>
  );
}
