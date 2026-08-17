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
    const [ page, setPage ] = useState(1);
    const [ hasMore, setHasMore ] = useState(true);
    const [ isLoadingMore, setIsLoadingMore ] = useState(false);
    const scrollBoxRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ pendingCapsuleMessage, setPendingCapsuleMessage ] = useState('');

    const [ openMenuId, setOpenMenuId ] = useState(null);
    const [ typing, setTyping ] = useState(false);
    const [ isPartnerTyping, setIsPartnerTyping ] = useState(false);
    const messageEndRef = useRef(null);
    const scrollToBottom = () =>{
        messageEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }

const handleUnsend = async (messageId) =>{
  try {
    await API.delete(`/api/messages/${messageId}`);

    setMessages((prev)=>prev.filter((m)=> m._id !== messageId));

    socket.emit("message deleted", {
      messageId: messageId,
      chatId: selectedChat, 
      senderId: user._id
    });

    setOpenMenuId(null);
  } catch (error) {
        console.error("Failed to unsend message", error);
        alert(error.response?.data?.message || "Could not unsend message");
  }
}

 useEffect(() => {
        socket.on('typing', () => setIsPartnerTyping(true));
        socket.on('stop typing', () => setIsPartnerTyping(false));

        return () => {
            socket.off('typing');
            socket.off('stop typing');
        };
    }, []);

     const fetchMessages = async (pageNumber = 1) =>{
        if(!selectedChat) return;
        try {
          if(pageNumber >1 ) setIsLoadingMore(true);

            const { data } = await API.get(`/api/messages/${selectedChat._id}?page=${pageNumber}&limit=20`);
            if(data.length < 20){
              setHasMore(false);
            }
            if(pageNumber ===1){
              
              setMessages(data);
            }else{
              setMessages((prevMessages)=> [...data, ...prevMessages]);
            }

            socket?.emit('join chat', selectedChat._id);
        } catch (error) {
            console.error('Failed to fetch messages: ', error);
        }finally{
          setIsLoadingMore(false);
        }
    }
   useEffect(()=>{
    setPage(1);
    setHasMore(true);
    setMessages([]);
    fetchMessages();
}, [selectedChat]);

const handleScroll = async (e) =>{
  if(e.target.scrollTop === 0 && hasMore && !isLoadingMore){
    prevScrollHeightRef.current = e.target.scrollHeight;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage);
  }
}



useEffect(() => {
        const activeChatHandler = (newMessageReceived) => {
            // ONLY update the message feed if the message belongs to THIS open chat
            if (selectedChat && selectedChat._id === newMessageReceived.chatId._id) {
                setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
            }
        };
        const messageRemovedHandler = (deletedMessgaeId) =>{
          setMessages((prevMessages)=> prevMessages.filter(m => m._id !== deletedMessgaeId));
        }
        socket.on('message received', activeChatHandler);
        socket.on('remove message', messageRemovedHandler);
        
        return () => {
          socket.off('message received', activeChatHandler);
          socket.off('remove message', messageRemovedHandler);
        }
    }, [selectedChat]);

    useEffect(()=>{
      if(page === 1){
        scrollToBottom();
      }
      else if(scrollBoxRef.current){
        const currentScrollHeight = scrollBoxRef.current.scrollHeight;
        scrollBoxRef.current.scrollTop = currentScrollHeight - prevScrollHeightRef.current;
      }
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
      <div 
        ref={scrollBoxRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingMore && (
          <div className="text-center text-xs text-slate-400 py-2 animate-pulse">
            Loading older messages...
        </div>
        )}    

        <span className="text-xs text-slate-400 px-3 py-1.5 mx-auto">
                This is the start of your encrypted conversation with {partner?.username}
              </span>
        {messages.map((m) => {
    const isMyMessage = m.sender._id === user._id;
    // Check if the message is less than 5 minutes old
    const isWithin5Mins = (new Date() - new Date(m.createdAt)) < 300000;

    return (
        <div key={m._id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
            
            <div className="flex items-center gap-2 group">
                
                {/* 3 DOT MENU (Only renders on the LEFT of MY messages) */}
                {isMyMessage && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setOpenMenuId(openMenuId === m._id ? null : m._id)}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
                        >
                            {/* Vertical dots SVG */}
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === m._id && (
                            <div className="absolute right-6 top-0 bg-slate-800 border border-slate-700 shadow-xl rounded-lg py-1 z-10 w-24">
                                {isWithin5Mins ? (
                                    <button 
                                        onClick={() => handleUnsend(m._id)}
                                        className="w-full text-left px-3 py-1 text-xs text-rose-400 hover:bg-slate-700"
                                    >
                                        Unsend
                                    </button>
                                ) : (
                                    <div className="px-3 py-1 text-[10px] text-slate-500 text-center">
                                        Too late to unsend
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* THE ACTUAL MESSAGE BUBBLE */}
                <div className={`px-4 py-2 rounded-2xl max-w-sm ${
                    isMyMessage 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-slate-800 text-slate-200 rounded-bl-none"
                }`}>
                    <p className="text-sm">{m.content}</p>
                </div>
                
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
