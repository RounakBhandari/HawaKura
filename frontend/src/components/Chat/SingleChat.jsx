import React, { useEffect, useRef, useState } from 'react'
import { useChatState } from '../../context/ChatProvider'
import io from 'socket.io-client';
import API from '../../config/api';
import { TimeCapsuleModal } from './TimeCapsuleModal';
import { socket } from '../../config/socket';


export const SingleChat = ({partner}) => {
    const { user, selectedChat, notification, setNotification , setChats, chats} = useChatState();
    const [ messages, setMessages ]  = useState([]);
    const [ newMessage, setNewMessage ] = useState('');
    const [ socketConnected, setSocketConnected ] = useState(false);

    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ pendingCapsuleMessage, setPendingCapsuleMessage ] = useState('');

    const [ typing, setTyping ] = useState(false);
    const [ isPartnerTyping, setIsPartnerTyping ] = useState(false);
    const messageEndRef = useRef(null);
    const scrollToBottom = () =>{
        messageEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }

 useEffect(() => {
        socket.on('typing', () => setIsPartnerTyping(true));
        socket.on('stop typing', () => setIsPartnerTyping(false));

        return () => {
            socket.off('typing');
            socket.off('stop typing');
        };
    }, []);

   useEffect(()=>{
    const fetchMessages = async () =>{
        if(!selectedChat) return;
        try {
            const { data } = await API.get(`/api/messages/${selectedChat._id}`);
            setMessages(data);
            
            // Use optional chaining so it doesn't crash if socket isn't ready yet
            socket?.emit('join chat', selectedChat._id);
        } catch (error) {
            console.error('Failed to fetch messages: ', error);
        }
    }
    fetchMessages();
}, [selectedChat]);

//     useEffect(() => {
//     const messageHandler = (newMessageReceived) => {
//         if (!selectedChat || selectedChat._id !== newMessageReceived.chatId._id) {
//             // Use functional state update to prevent stale data
//             setNotification((prev) => {
//                 // Prevent duplicate notifications for the same message
//                 if (!prev.some(n => n._id === newMessageReceived._id)) {
//                     return [newMessageReceived, ...prev];
//                 }
//                 return prev;
//             });
//         } else {
//             setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
//         }

//         setChats((prevChats) => {
//             const updatedChats = prevChats.map((chat) =>
//                 chat._id === newMessageReceived.chatId._id ? { ...chat, latestMessage: newMessageReceived } : chat
//             );
//             return updatedChats.sort((a, b) => {
//                 const dateA = new Date(a.latestMessage?.createdAt || a.createdAt);
//                 const dateB = new Date(b.latestMessage?.createdAt || b.createdAt);
//                 return dateB - dateA;
//             });
//         });
//     };

//     socket.on('message received', messageHandler);
    
//     return () => socket.off('message received', messageHandler);
// }, [selectedChat]); 

useEffect(() => {
        const activeChatHandler = (newMessageReceived) => {
            // ONLY update the message feed if the message belongs to THIS open chat
            if (selectedChat && selectedChat._id === newMessageReceived.chatId._id) {
                setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
            }
        };

        socket.on('message received', activeChatHandler);
        
        return () => socket.off('message received', activeChatHandler);
    }, [selectedChat]);

    useEffect(()=>{
        scrollToBottom();
    }, [messages]);

    const typingHandler = (e) =>{
        setNewMessage(e.target.value);
        if(!socketConnected) return;

        if(!typing){
            setTyping(true);
            socket.emit('typing', selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        
        setTimeout(()=>{
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if(timeDiff >= timerLength && typing){
                socket.emit('stop typing', selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    }

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
            socket.emit('new message', data);
            setMessages([...messages, data]);
            setChats((prevChat)=>{
                const updatedChats = prevChat.map((chat)=> chat._id === selectedChat._id ? {...chat, latestMessage: data}: chat);
                console.log(`prevChat:`, prevChat)
            return updatedChats.sort((a, b)=>{
                const dateA = new Date(a.latestMessage?.createdAt || a.createdAt);
                const dateB = new Date(b.latestMessage?.createdAt || b.createdAt);
                return dateB - dateA; 
            });
            });
            socket.emit('stop typing', selectedChat._id);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    }

    const handleTimeCapsuleTrigger = (e) => {
        e.preventDefault();
        if(!newMessage.trim()) return;
        setPendingCapsuleMessage(newMessage);
        setIsModalOpen(true);
    };



  return (
    <div className="flex flex-col h-full bg-slate-950/50 relative">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <span className="text-xs text-slate-400 px-3 py-1.5 mx-auto">
                This is the start of your encrypted conversation with {partner?.username}
              </span>
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
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-1 w-fit">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={(e) => sendMessage(e)} className="flex items-center gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={typingHandler}
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
