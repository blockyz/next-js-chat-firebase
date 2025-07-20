"use client";
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, setLogLevel } from "firebase/firestore";
import { ArrowRight, MessageSquare, LogIn, User, KeyRound, Sparkles, BookOpen, X, Loader2 } from "lucide-react";
import LoginPage from "@/Components/LoginPage";
import ChatRoom from "@/Components/ChatRoom";

// --- Firebase Configuration ---
// This configuration is now hardcoded to ALWAYS use your 'pbyz-13' project.
export const firebaseConfig = {
  apiKey: "AIzaSyCUfgSk7tvILtPgOzxB470Du5s9BLA5LOc",
  authDomain: "pbyz-13.firebaseapp.com",
  projectId: "pbyz-13",
  storageBucket: "pbyz-13.firebasestorage.app",
  messagingSenderId: "384278929356",
  appId: "1:384278929356:web:2fc21a2c82fad47409c769",
};

// --- App ID ---
// This ID is provided by the environment and is used to create the database path.
const appId = "1:384278929356:web:2fc21a2c82fad47409c769";

// --- Main App Component ---
export default function Home() {
  const [page, setPage] = useState("login");
  const [roomCode, setRoomCode] = useState("");
  const [auth, setAuth] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setLogLevel("debug");
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);

    setAuth(authInstance);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        console.log("User is authenticated:", user.uid);
        setIsAuthReady(true);
      } else {
        console.log("User is not authenticated.");
      }
    });

    const signIn = async () => {
      try {
        if (!authInstance.currentUser) {
          // Note: In this environment, __initial_auth_token might be for the temporary DB.
          // For your own project, anonymous sign-in is the key.
          // if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          //     await signInWithCustomToken(authInstance, __initial_auth_token).catch(async (e) => {
          //         console.log("Custom token failed, falling back to anonymous", e);
          //         await signInAnonymously(authInstance);
          //     });
          // } else {
          await signInAnonymously(authInstance);
          // }
        } else {
          setIsAuthReady(true);
        }
      } catch (error) {
        console.error("Sign-in process failed:", error);
      }
    };

    signIn();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !isAuthReady) return;

    const seedRoom = async () => {
      const roomRef = doc(db, `artifacts/${appId}/public/data/rooms`, "general");
      try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) {
          await setDoc(roomRef, {
            name: "General Chat",
            password: "password123",
          });
        }
      } catch (error) {
        console.error("Error seeding room:", error);
      }
    };

    seedRoom();
  }, [db, isAuthReady]);

  const handleLoginSuccess = (code: any) => {
    setRoomCode(code);
    setPage("chat");
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-400 mb-4" />
          <p className="text-lg">Connecting to your database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {page === "login" ? <LoginPage db={db} onLoginSuccess={handleLoginSuccess} /> : <ChatRoom db={db} roomCode={roomCode} />}
    </div>
  );
}

// // --- Login Page Component ---
// function LoginPage({ db, onLoginSuccess }) {
//     const [roomCode, setRoomCode] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const handleLogin = async (e) => {
//         e.preventDefault();
//         if (!roomCode || !password) {
//             setError('Please enter both room code and password.');
//             return;
//         }
//         setIsLoading(true);
//         setError('');

//         try {
//             const roomRef = doc(db, `artifacts/${appId}/public/data/rooms`, roomCode);
//             const roomSnap = await getDoc(roomRef);

//             if (roomSnap.exists() && roomSnap.data().password === password) {
//                 onLoginSuccess(roomCode);
//             } else if (roomSnap.exists()) {
//                 setError('Incorrect password. Please try again.');
//             } else {
//                 setError('Room code not found.');
//             }
//         } catch (err) {
//             console.error("Login error:", err);
//             setError('Failed to connect to the server.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex items-center justify-center min-h-screen bg-gray-900">
//             <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
//                 <div className="text-center">
//                     <MessageSquare className="mx-auto h-12 w-12 text-blue-400" />
//                     <h2 className="mt-4 text-3xl font-bold text-white">Join a Chat Room</h2>
//                     <p className="mt-2 text-sm text-gray-400">
//                         Default room: <code className="bg-gray-700 p-1 rounded">general</code>,
//                         password: <code className="bg-gray-700 p-1 rounded">password123</code>
//                     </p>
//                 </div>
//                 <form className="space-y-6" onSubmit={handleLogin}>
//                     <div>
//                         <label htmlFor="room-code" className="text-sm font-medium text-gray-300">Room Code</label>
//                         <div className="mt-1 relative">
//                              <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
//                             <input id="room-code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg" placeholder="e.g., general" />
//                         </div>
//                     </div>
//                     <div>
//                         <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
//                          <div className="mt-1 relative">
//                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
//                             <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg" placeholder="••••••••" />
//                         </div>
//                     </div>
//                     {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
//                     <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
//                         {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enter Chat'}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }

// // --- Chat Room Component ---
// function ChatRoom({ db, roomCode }) {
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [username, setUsername] = useState('');
//     const [isSending, setIsSending] = useState(false);
//     const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
//     const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
//     const [summary, setSummary] = useState('');
//     const [aiLoading, setAiLoading] = useState(null);
//     const messagesEndRef = useRef(null);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     useEffect(() => {
//         if (!db || !roomCode) return;
//         const messagesCollectionPath = `artifacts/${appId}/public/data/rooms/${roomCode}/messages`;
//         const q = query(collection(db, messagesCollectionPath), orderBy('createdAt', 'asc'));
//         const unsubscribe = onSnapshot(q, (querySnapshot) => {
//             setMessages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//         }, (error) => console.error("Error listening to messages:", error));
//         return () => unsubscribe();
//     }, [db, roomCode]);

//     const callGemini = async (prompt) => {
//         const apiKey = "";
//         const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
//         try {
//             const response = await fetch(apiUrl, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
//             });
//             if (!response.ok) throw new Error(`API Error: ${response.status}`);
//             const result = await response.json();
//             return result.candidates[0]?.content?.parts[0]?.text || "";
//         } catch (error) {
//             console.error("Gemini API call failed:", error);
//             return `Error: Could not get a response from AI.`;
//         }
//     };

//     const handleSummarize = async () => {
//         setAiLoading('summary');
//         setIsSummaryModalOpen(true);
//         const last20Messages = messages.slice(-20).map(m => `${m.username}: ${m.text}`).join('\n');
//         const prompt = `Please provide a brief, concise summary of the following chat conversation:\n\n${last20Messages}`;
//         const result = await callGemini(prompt);
//         setSummary(result);
//         setAiLoading(null);
//     };

//     const handleFixGrammar = async () => {
//         if (!newMessage.trim()) return;
//         setAiLoading('fix');
//         const prompt = `Correct the spelling and grammar of the following text, without changing its meaning. Only return the corrected text:\n\n"${newMessage}"`;
//         const result = await callGemini(prompt);
//         setNewMessage(result.replace(/"/g, ''));
//         setAiLoading(null);
//         setIsAiAssistantOpen(false);
//     };

//     const handleSuggestReply = async () => {
//         setAiLoading('suggest');
//         const last5Messages = messages.slice(-5).map(m => `${m.username}: ${m.text}`).join('\n');
//         const prompt = `Based on the last few messages in this chat, suggest a relevant and natural-sounding reply. The user has started typing: "${newMessage}".\n\nConversation:\n${last5Messages}\n\nSuggested reply:`;
//         const result = await callGemini(prompt);
//         setNewMessage(result);
//         setAiLoading(null);
//         setIsAiAssistantOpen(false);
//     };

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         if (newMessage.trim() === '' || isSending) return;
//         setIsSending(true);
//         const finalUsername = username.trim() === '' ? 'Anonymous' : username;
//         try {
//             const messagesCollectionPath = `artifacts/${appId}/public/data/rooms/${roomCode}/messages`;
//             await addDoc(collection(db, messagesCollectionPath), {
//                 text: newMessage,
//                 username: finalUsername,
//                 createdAt: serverTimestamp()
//             });
//             setNewMessage('');
//         } catch (error) {
//             console.error("Error sending message:", error);
//         } finally {
//             setIsSending(false);
//         }
//     };

//     return (
//         <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
//             <header className="flex justify-between items-center mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
//                 <div>
//                     <h1 className="text-2xl font-bold text-white">Room: <span className="text-blue-400">{roomCode}</span></h1>
//                     <p className="text-sm text-gray-400">Welcome! Messages are live.</p>
//                 </div>
//                 <button onClick={handleSummarize} disabled={aiLoading === 'summary' || messages.length < 2} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
//                     {aiLoading === 'summary' ? <Loader2 className="animate-spin h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
//                     ✨ Summarize
//                 </button>
//             </header>

//             <div className="flex-1 overflow-y-auto bg-gray-800/50 p-4 rounded-xl custom-scrollbar border border-gray-700">
//                 {messages.length === 0 ? (
//                      <div className="flex items-center justify-center h-full"><p className="text-gray-500">No messages yet. Be the first!</p></div>
//                 ) : (
//                     messages.map(msg => (
//                         <div key={msg.id} className="mb-4 p-3 rounded-lg max-w-lg break-words bg-gray-700">
//                             <div className="flex items-baseline justify-between">
//                                 <p className="font-bold text-blue-300">{msg.username}</p>
//                                 <p className="text-xs text-gray-500">{msg.createdAt?.toDate().toLocaleTimeString()}</p>
//                             </div>
//                             <p className="text-white mt-1 whitespace-pre-wrap">{msg.text}</p>
//                         </div>
//                     ))
//                 )}
//                 <div ref={messagesEndRef} />
//             </div>

//             <footer className="mt-4">
//                 <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
//                     <div className="relative flex-shrink-0">
//                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//                         <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Name" className="w-full sm:w-48 pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg" />
//                     </div>
//                     <div className="relative flex-grow">
//                          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="w-full pl-4 pr-24 py-2.5 bg-gray-700 border border-gray-600 rounded-lg" required />
//                          <div className="absolute right-12 top-1/2 -translate-y-1/2">
//                              <button type="button" onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)} className="p-2 text-yellow-400 hover:text-yellow-300">
//                                  <Sparkles className="h-5 w-5" />
//                              </button>
//                              {isAiAssistantOpen && (
//                                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-600 border border-gray-500 rounded-lg shadow-xl z-10">
//                                     <button onClick={handleFixGrammar} disabled={aiLoading === 'fix' || !newMessage.trim()} className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-500 rounded-t-lg disabled:opacity-50">
//                                         {aiLoading === 'fix' ? <Loader2 className="animate-spin h-4 w-4" /> : '✨'} Fix Grammar
//                                     </button>
//                                     <button onClick={handleSuggestReply} disabled={aiLoading === 'suggest'} className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-500 rounded-b-lg disabled:opacity-50">
//                                         {aiLoading === 'suggest' ? <Loader2 className="animate-spin h-4 w-4" /> : '✨'} Suggest Reply
//                                     </button>
//                                 </div>
//                              )}
//                          </div>
//                         <button type="submit" disabled={isSending || newMessage.trim() === ''} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 disabled:opacity-50">
//                             <ArrowRight className="h-5 w-5" />
//                         </button>
//                     </div>
//                 </form>
//             </footer>

//             {isSummaryModalOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 p-4">
//                     <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700">
//                         <div className="flex justify-between items-center mb-4">
//                             <h3 className="text-xl font-bold text-white">✨ Chat Summary</h3>
//                             <button onClick={() => setIsSummaryModalOpen(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
//                         </div>
//                         <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto custom-scrollbar">
//                             {aiLoading === 'summary' ? (
//                                 <div className="flex items-center justify-center gap-3 text-gray-300">
//                                     <Loader2 className="animate-spin h-5 w-5" /> Generating summary...
//                                 </div>
//                             ) : (
//                                 <p className="text-gray-200 whitespace-pre-wrap">{summary}</p>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <style>{`
//                 .custom-scrollbar::-webkit-scrollbar { width: 8px; }
//                 .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
//                 .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
//                 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
//             `}</style>
//         </div>
//     );
// }
