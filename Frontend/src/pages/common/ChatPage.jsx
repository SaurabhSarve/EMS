import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatPage.css';
import { 
    FiSearch, FiLock, FiPlus, FiX, FiSend, 
    FiArrowLeft, FiMoreVertical, FiTrash2, 
    FiEdit2, FiCheck, FiMessageSquare, FiClock 
} from 'react-icons/fi';

const ReadyState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

const useChatWebSocket = (url) => {
    const [lastJsonMessage, setLastJsonMessage] = useState(null);
    const [readyState, setReadyState] = useState(ReadyState.CLOSED);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    useEffect(() => {
        if (!url) return;
        const connect = () => {
            setReadyState(ReadyState.CONNECTING);
            const socket = new WebSocket(url);
            ws.current = socket;
            socket.onopen = () => setReadyState(ReadyState.OPEN);
            socket.onclose = () => {
                setReadyState(ReadyState.CLOSED);
                reconnectTimeout.current = setTimeout(connect, 3000);
            };
            socket.onerror = () => socket.close();
            socket.onmessage = (event) => {
                try { setLastJsonMessage(JSON.parse(event.data)); } catch (e) {}
            };
        };
        connect();
        return () => {
            if (ws.current) ws.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [url]);

    const sendJsonMessage = (data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    };
    return { sendJsonMessage, lastJsonMessage, readyState };
};

const formatTimeIST = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
};

const ChatPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jwtToken] = useState(localStorage.getItem('token'));
    const [conversationList, setConversationList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageHistory, setMessageHistory] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isChatDisabled, setIsChatDisabled] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState(""); 
    const [showNewChatModal, setShowNewChatModal] = useState(false); 
    const [globalSearchQuery, setGlobalSearchQuery] = useState(""); 
    const [globalSearchResults, setGlobalSearchResults] = useState([]); 
    const [showMenu, setShowMenu] = useState(false); 
    const [editingMsgId, setEditingMsgId] = useState(null); 
    const [editText, setEditText] = useState(""); 

    const bottomRef = useRef(null);
    const CHAT_BASE_URL = "https://employee-management-system-chat-feature.onrender.com"; 
    const WS_URL = jwtToken ? `wss://employee-management-system-chat-feature.onrender.com/ws/chat/?token=${jwtToken}` : null;
    const { sendJsonMessage, lastJsonMessage, readyState } = useChatWebSocket(WS_URL);

    // --- NAVIGATION HANDLER ---
    const handleGoBack = () => {
        if (user.role === 'Admin') navigate('/admin/dashboard');
        else if (user.role === 'Department Head') navigate('/head/dashboard');
        else navigate('/employee/dashboard');
    };

    const fetchRecentChats = async () => {
        if (!user) return;
        try {
            const currentUserId = user.id || user._id;
            const res = await axios.get(`/api/chat/recent/${currentUserId}`);
            setConversationList(res.data);
        } catch (err) {}
    };
    useEffect(() => { fetchRecentChats(); }, [user]);

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (globalSearchQuery.length > 1) {
                const currentUserId = user.id || user._id;
                try {
                    const res = await axios.get(`/api/chat/search?q=${globalSearchQuery}&user_id=${currentUserId}`);
                    setGlobalSearchResults(res.data);
                } catch (err) {}
            } else { setGlobalSearchResults([]); }
        }, 500);
        return () => clearTimeout(delay);
    }, [globalSearchQuery, user]);

    const handleUserSelect = (targetUser) => {
        setSelectedUser(targetUser);
        setSidebarSearch(""); 
        setShowNewChatModal(false); 
        setGlobalSearchQuery(""); 
        setGlobalSearchResults([]); 
        setShowMenu(false);
        setConversationList(prev => prev.map(c => c.user._id === targetUser._id ? { ...c, unread_count: 0 } : c));
        const currentUserId = user.id || user._id;
        axios.get(`/api/chat/history/${currentUserId}?other_user=${targetUser._id}`)
            .then(res => {
                setMessageHistory(res.data.messages || []);
                setIsChatDisabled(res.data.is_disabled || false);
            });
    };

    useEffect(() => {
        if (lastJsonMessage) {
            const currentUserId = user.id || user._id;
            if (lastJsonMessage.type === "error") { alert(lastJsonMessage.error); return; }
            if (lastJsonMessage.type === "activity") {
                const action = lastJsonMessage.action;
                if (action === "clear_chat" && lastJsonMessage.initiator_id === currentUserId) setMessageHistory([]);
                else if (action === "delete_message") setMessageHistory(prev => prev.filter(m => m.id !== lastJsonMessage.message_id));
                else if (action === "edit_message") setMessageHistory(prev => prev.map(m => m.id === lastJsonMessage.message_id ? { ...m, message: lastJsonMessage.new_text } : m));
                fetchRecentChats();
                return;
            }
            if (lastJsonMessage.type === "status_update") { if (selectedUser && lastJsonMessage.participants.includes(selectedUser._id)) setIsChatDisabled(lastJsonMessage.is_disabled); return; }

            const isDuplicate = messageHistory.some(m => m.id === lastJsonMessage.id);
            if (!isDuplicate && ((selectedUser && (lastJsonMessage.sender_id === selectedUser._id || lastJsonMessage.receiver_id === selectedUser._id)) || (lastJsonMessage.sender_id === currentUserId))) {
                setMessageHistory((prev) => [...prev, { id: lastJsonMessage.id, sender: lastJsonMessage.sender_id, message: lastJsonMessage.message, timestamp: lastJsonMessage.timestamp }]);
            }

            if (lastJsonMessage.sender_id && lastJsonMessage.sender_id !== currentUserId) {
                if (!selectedUser || selectedUser._id !== lastJsonMessage.sender_id) {
                    setConversationList(prev => prev.map(c => c.user._id === lastJsonMessage.sender_id ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: lastJsonMessage.message, updated_at: lastJsonMessage.timestamp } : c));
                } else {
                    setConversationList(prev => prev.map(c => c.user._id === lastJsonMessage.sender_id ? { ...c, last_message: lastJsonMessage.message, updated_at: lastJsonMessage.timestamp } : c));
                }
            }
        }
    }, [lastJsonMessage]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser) return;
        if (isChatDisabled && user.role !== 'Admin') return;
        sendJsonMessage({ message: inputMessage, receiverId: selectedUser._id });
        setInputMessage("");
    };

    const handleDeleteConversation = async () => {
        if (!window.confirm("Clear this chat for me?")) return;
        try {
            const currentUserId = user.id || user._id;
            await axios.delete(`/api/chat/delete_all?user_id=${currentUserId}&other_user=${selectedUser._id}`);
            setMessageHistory([]); 
            setShowMenu(false);
        } catch (e) {}
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete message for everyone?")) return;
        try { await axios.delete(`/api/chat/message/${msgId}?user_id=${user.id || user._id}`); } catch (e) {}
    };

    const startEditing = (msg) => { setEditingMsgId(msg.id); setEditText(msg.message); };
    const cancelEditing = () => { setEditingMsgId(null); setEditText(""); };
    const saveEdit = async (msgId) => {
        if (!editText.trim()) return;
        try {
            await axios.put(`/api/chat/message/${msgId}?user_id=${user.id || user._id}`, { message: editText });
            setEditingMsgId(null);
        } catch (e) {}
    };

    const toggleChat = async () => {
        try {
            const action = isChatDisabled ? 'enable' : 'disable';
            await axios.post(`/api/chat/toggle`, { admin_id: user.id || user._id, target_user_id: selectedUser._id, action: action });
        } catch (err) {}
    };

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messageHistory]);

    const filteredSidebarList = conversationList.filter(conv => {
        const fullName = `${conv.user.firstName} ${conv.user.lastName}`.toLowerCase();
        return fullName.includes(sidebarSearch.toLowerCase());
    });

    return (
        <div className="flex h-screen bg-[#F0F2F5] font-sans overflow-hidden p-0 lg:p-4">
            
            {/* --- NEW CHAT MODAL --- */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-[550px] overflow-hidden border border-white/20">
                        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="font-bold text-xl">New Conversation</h3>
                                <p className="text-indigo-100 text-xs">Search colleagues to start chatting</p>
                            </div>
                            <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><FiX size={24} /></button>
                        </div>
                        <div className="p-4 bg-slate-50 border-b">
                            <div className="relative group">
                                <FiSearch className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input type="text" placeholder="Search by Name..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} autoFocus />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white p-2">
                            {globalSearchResults.map(u => (
                                <div key={u._id} onClick={() => handleUserSelect(u)} className="mx-2 my-1 px-4 py-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 cursor-pointer flex items-center gap-4 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover rounded-full"/> : (u.firstName ? u.firstName[0] : 'U')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-800 group-hover:text-indigo-700 truncate">{u.firstName} {u.lastName}</p>
                                            {/* Employee ID Badge */}
                                            {u.employeeId && <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md flex-shrink-0 ml-2">{u.employeeId}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600 font-bold uppercase tracking-tighter">{u.role}</span>
                                            {u.department_name && <span className="text-xs text-gray-400 font-medium tracking-tight truncate">• {u.department_name}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SIDEBAR PANEL --- */}
            <div className="w-full lg:w-[380px] bg-white border-r border-gray-200 flex flex-col shadow-2xl z-10 lg:rounded-l-3xl overflow-hidden">
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={handleGoBack} className="p-2.5 bg-slate-50 text-gray-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100 shadow-sm"><FiArrowLeft size={20} /></button>
                            <h2 className="font-black text-2xl text-gray-800 tracking-tight">Messages</h2>
                        </div>
                        <button onClick={() => { setShowNewChatModal(true); setGlobalSearchQuery(''); setGlobalSearchResults([]); }} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"><FiPlus size={22} /></button>
                    </div>
                    <div className="relative group">
                        <FiSearch className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input type="text" placeholder="Search conversations..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white px-3 py-2 space-y-1">
                    {filteredSidebarList.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><FiMessageSquare size={32} className="text-slate-300"/></div>
                            <p className="text-gray-400 text-sm font-bold">No active chats</p>
                        </div>
                    ) : filteredSidebarList.map(conv => {
                        const isActive = selectedUser?._id === conv.user._id;
                        return (
                            <div key={conv.conversation_id} onClick={() => handleUserSelect(conv.user)} 
                                 className={`px-4 py-4 rounded-2xl cursor-pointer flex items-center gap-4 transition-all duration-300 group
                                 ${isActive ? 'bg-indigo-600 shadow-xl shadow-indigo-100 translate-x-1' : 'hover:bg-slate-50'}`}>
                                
                                <div className="relative flex-shrink-0">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl overflow-hidden border-2 transition-all
                                        ${isActive ? 'border-white/30 bg-white/20 text-white' : 'border-gray-100 bg-indigo-50 text-indigo-600 group-hover:scale-105'}`}>
                                        {conv.user.profilePhoto ? <img src={conv.user.profilePhoto} className="w-full h-full object-cover"/> : (conv.user.firstName ? conv.user.firstName[0] : 'U')}
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-4 border-white animate-bounce shadow-lg">
                                            {conv.unread_count}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p className={`text-sm truncate font-bold ${isActive ? 'text-white' : 'text-gray-800'}`}>{conv.user.firstName} {conv.user.lastName}</p>
                                        {conv.updated_at && (<span className={`text-[10px] font-bold ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>{formatTimeIST(conv.updated_at).split(' ')[0]}</span>)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{conv.user.role}</span>
                                        {conv.user.department_name && <span className={`text-xs truncate font-medium ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>• {conv.user.department_name}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- MAIN CHAT WINDOW PANEL --- */}
            <div className="flex-1 flex flex-col bg-white lg:rounded-r-3xl overflow-hidden shadow-inner border-l border-gray-100">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="px-8 py-5 bg-white border-b border-gray-100 shadow-sm flex justify-between items-center z-10 backdrop-blur-md bg-white/80">
                            <div className="flex items-center gap-5">
                                <div className="relative group">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg group-hover:rotate-6 transition-transform">
                                        {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-full h-full object-cover rounded-2xl"/> : selectedUser.firstName[0]}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-800 tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedUser.role}</span>
                                        {selectedUser.department_name && <span className="text-xs text-gray-400 font-bold tracking-tighter">| {selectedUser.department_name}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {isChatDisabled && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm animate-pulse">
                                        <FiLock size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Chat Locked</span>
                                    </div>
                                )}
                                {/* --- UPDATED PERMISSION LOGIC --- */}
                                {(user.role === 'Admin' || (user.role === 'Department Head' && selectedUser.role !== 'Admin')) && (
                                    <button onClick={toggleChat} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 ${isChatDisabled ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-green-100' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-rose-100'}`}>
                                        {isChatDisabled ? 'Unlock Chat' : 'Lock Chat'}
                                    </button>
                                )}
                                
                                <div className="relative">
                                    <button onClick={() => setShowMenu(!showMenu)} className="p-3 hover:bg-slate-50 text-gray-400 rounded-2xl transition-all border border-transparent hover:border-gray-100"><FiMoreVertical size={20}/></button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-14 w-56 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <button onClick={handleDeleteConversation} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors">
                                                <FiTrash2 size={18}/> Clear Chat History
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F9FBFF] custom-scrollbar" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, backgroundOpacity: 0.02}}>
                            {messageHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center mt-20 opacity-30">
                                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-500"><FiSend size={40}/></div>
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Send a message to start</p>
                                </div>
                            )}
                            
                            {messageHistory.map((msg, idx) => {
                                const isMe = msg.sender === (user.id || user._id);
                                return (
                                    <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-500`}>
                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            
                                            {editingMsgId === msg.id ? (
                                                <div className="flex items-center gap-3 bg-white border-2 border-indigo-500 p-3 rounded-2xl shadow-2xl w-full min-w-[300px]">
                                                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="outline-none text-sm text-gray-800 w-full bg-transparent font-medium" autoFocus />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => saveEdit(msg.id)} className="bg-emerald-500 text-white p-2 rounded-xl shadow-md hover:bg-emerald-600 transition-colors"><FiCheck/></button>
                                                        <button onClick={cancelEditing} className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200 transition-colors"><FiX/></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative group break-words whitespace-pre-wrap transition-all
                                                    ${isMe 
                                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-indigo-100' 
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none shadow-slate-100'}`}>
                                                    
                                                    {msg.message}
                                                    
                                                    {isMe && (
                                                        <div className="absolute top-1/2 -left-20 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white shadow-xl rounded-full p-1.5 border border-gray-100 z-10 animate-in fade-in slide-in-from-right-2">
                                                            <button onClick={() => startEditing(msg)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><FiEdit2 size={14}/></button>
                                                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors"><FiTrash2 size={14}/></button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-60">
                                                <FiClock size={10} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{formatTimeIST(msg.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="flex gap-4 max-w-5xl mx-auto items-center">
                                <div className="relative flex-1 group">
                                    <input 
                                        type="text" 
                                        value={inputMessage} 
                                        onChange={(e) => setInputMessage(e.target.value)} 
                                        disabled={isChatDisabled && user.role !== 'Admin'} 
                                        placeholder={isChatDisabled ? "Chat is locked by authority..." : "Write a message..."} 
                                        className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-transparent rounded-3xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 shadow-inner" 
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!inputMessage.trim() || (isChatDisabled && user.role !== 'Admin')} 
                                    className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 flex items-center justify-center
                                        ${!inputMessage.trim() ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'}`}
                                >
                                    <FiSend size={22} className={inputMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#F9FBFF] text-center p-12 relative">
                        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{backgroundImage: `radial-gradient(#C7D2FE 1px, transparent 1px)`, backgroundSize: '30px 30px'}}></div>
                        <div className="w-48 h-48 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-8 relative rotate-3 animate-pulse-slow border border-indigo-50">
                            <FiMessageSquare size={80} className="text-indigo-600/20 absolute -translate-x-2 -translate-y-2" />
                            <FiMessageSquare size={80} className="text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">Enterprise Messaging</h2>
                        <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                            Select a colleague from the sidebar or start a secure new conversation using the plus button.
                        </p>
                        <button 
                            onClick={() => { setShowNewChatModal(true); setGlobalSearchQuery(''); }} 
                            className="group bg-white border-2 border-indigo-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-50 transition-all hover:-translate-y-1 flex items-center gap-3 active:scale-95"
                        >
                            <FiPlus size={18} className="text-indigo-600" /> 
                            <span className="text-indigo-600">Start New Chat</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;