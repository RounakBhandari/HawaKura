import React, { useState } from 'react'
import { useChatState } from '../../context/ChatProvider';
import API from '../../config/api';
import { useEffect } from 'react';

export const Sidebar = () => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch ] = useState(false);
    const [ loadingChat, setLoadingChat] = useState(false);
    const {user, selectedChat, setSelectedChat, chats, setChats, logout} = useChatState();

    const fetchChats = async () =>{
        try{
            const {data} = await API.get('/api/chats');
            setChats(data);
        } catch(err){
            console.error('Failed to load chats', err);
        }
    };

    useEffect(()=>{
        fetchChats();
    }, []);

    const handleSearch = async (query) =>{
        setSearch(query);
        if(!query.trim()){
            setSearchResults([]);
            return;
        }

        try{
            setLoadingSearch(true);
            const {data} = await API.get(`/api/users?search=${query}`);
            setSearchResults(data);
        } catch (err){
            console.error('Search error: ', err);
        } finally{
            setLoadingSearch(false);
        }
    };

    const accessChat = async (userId) => {
        try {
            setLoadingChat(true);
            const {data} = await API.post('/api/chats', { userId });

            if(!chats.find((c) => c._id === data._id)){
                setChats([data, ...chats]);
            }

            setSelectedChat(data);
            setSearch('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error Opening chat: ', err);
            
        }finally {
            setLoadingChat(false);
        }
    }

    const getSender = (loggedUser, users) =>{
        return users[0]?._id === loggedUser?._id ? users[1] : users[0];
    }

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col h-full">
      {/* Top Profile Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar}
            alt={user?.username}
            className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover"
          />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{user?.username}</h2>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Online
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-rose-400 font-medium px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/20 hover:bg-rose-500/10 transition"
        >
          Logout
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users to message..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          {loadingSearch && (
            <div className="absolute right-3 top-3 text-[10px] text-indigo-400 animate-spin">
              ⌛
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/50 shadow-2xl">
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => accessChat(u._id)}
                className="p-3 hover:bg-indigo-600/10 cursor-pointer flex items-center gap-3 transition"
              >
                <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-xs font-medium text-slate-200">{u.username}</p>
                  <p className="text-[10px] text-slate-400">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Chats List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1">
          Recent Conversations
        </p>

        {loadingChat ? (
          <p className="text-xs text-slate-500 p-2">Loading conversation...</p>
        ) : chats.length === 0 ? (
          <p className="text-xs text-slate-500 p-2">No active chats. Search for a user above!</p>
        ) : (
          chats.map((chat) => {
            const partner = getSender(user, chat.users);
            const isSelected = selectedChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-white'
                    : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                }`}
              >
                <img
                  src={partner?.avatar}
                  alt={partner?.username}
                  className="w-10 h-10 rounded-full border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-xs font-semibold truncate text-slate-200">
                      {partner?.username}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {chat.latestMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
