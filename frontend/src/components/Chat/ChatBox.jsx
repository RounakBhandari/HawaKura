import React, { useState } from 'react'
import { useChatState } from '../../context/ChatProvider'
import { SingleChat } from './SingleChat';

export const ChatBox = () => {

    const { selectedChat, user } = useChatState();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const getSender = (loggedUser, users)=>{
        return users[0]?._id === loggedUser?._id ? users[1] : users[0];
    }

    const partner = selectedChat ? getSender(user, selectedChat.users) : null;

    const isPartnerOnline = partner ? onlineUsers.includes(partner._id) : false;


   return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 relative">
      {selectedChat ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={partner?.avatar}
                alt={partner?.username}
                className="w-9 h-9 rounded-full border border-slate-800"
              />
              {isPartnerOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              )}
              <div>
                <h2 className="text-sm font-semibold text-slate-100">{partner?.username}</h2>
                <span className="text-[10px] text-slate-400">
                {isPartnerOnline ? 'Online' : 'Offline'}
              </span>
              </div>
            </div>
          </div>

          {/* Message History Feed Placeholder */}
          {/* <div className="flex-1 p-6 overflow-y-auto ">
            <div className="text-center my-8">
              
             
            </div>
          </div> */}
           <div className="flex-1 overflow-hidden ">
            
                <SingleChat partner={partner} />
          </div>
        </div>
        
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 text-2xl mb-4 shadow-xl">
            💬
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">Welcome to HawaKura</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Select an existing conversation from the sidebar or search for a user to start messaging in real-time.
          </p>
        </div>
      )}
    </main>
  );
}
