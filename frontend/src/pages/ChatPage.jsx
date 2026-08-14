import React from 'react'
import { Sidebar } from '../components/Chat/Sidebar'
import { ChatBox } from '../components/Chat/ChatBox'

export const ChatPage = () => {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-950 font-sans antialiased">
        <Sidebar/>
        <ChatBox/>
    </div>
  )
}
