import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";



function App(){
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage/>}/>
      <Route path="/chats" element={<ChatPage/>}/>
      <Route path="*" element={<Navigate to="/auth" replace/>}/>
    </Routes>
  )
}

export default App;