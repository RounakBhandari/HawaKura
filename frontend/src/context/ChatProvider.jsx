import React, { useEffect, createContext, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ChatContext = createContext();
export const ChatProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [selectedChat, setSelectedChat]= useState(null);
    const [chats, setChats] = useState([]);
    const [notification, setNotification] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setUser(userInfo);

        if(!userInfo && location.pathname !== '/auth'){
            navigate('/auth');
        } 
        else if(userInfo && location.pathname === '/auth'){
            navigate('/chats');
            
        }
    }, [navigate, location.pathname]);

    const logout = () =>{
        localStorage.removeItem('userInfo');
        setUser(null);
        setSelectedChat(null);
        navigate('/auth');
    };


  return (
    <ChatContext.Provider value = {{
        user, setUser, selectedChat, setSelectedChat, chats, setChats, notification, setNotification, logout
    }}>
        {children}
        </ChatContext.Provider>
  )
}

export const useChatState = () => {
  return useContext(ChatContext);
};