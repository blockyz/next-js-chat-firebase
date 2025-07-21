"use client";
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, setLogLevel } from "firebase/firestore";
import { ArrowRight, MessageSquare, LogIn, User, KeyRound, Sparkles, BookOpen, X, Loader2 } from "lucide-react";
import { firebaseConfig } from "@/Constants";
export default function ChatRoom({ db, roomCode, session, onLogout }: any) {
  const [messages, setMessages] = useState<any>([]);
  const [newMessage, setNewMessage] = useState<any>("");
  const messagesEndRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!db || !roomCode) return;
    const messagesCollectionPath = `rooms/${roomCode}/messages`;
    const q = query(collection(db, messagesCollectionPath), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setMessages(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [db, roomCode]);

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    // Include the userId and the session token in the message
    // The security rule will validate this.
    const messageData = {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: {
        id: session.userId,
        token: session.token,
        name: session.profile.name,
        profilePictureUrl: session.profile.profilePictureUrl || "",
      },
    };

    await addDoc(collection(db, `rooms/${roomCode}/messages`), messageData);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700 shrink-0">
        <h1 className="text-2xl font-bold">
          Room: <span className="text-blue-400">{roomCode}</span>
        </h1>
        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white">
          Logout
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-800/50 custom-scrollbar">
        {messages.map((msg: any) => (
          <div key={msg.id} className="flex items-start gap-3 mb-4">
            <img
              src={msg.user.profilePictureUrl || "https://placehold.co/40x40/4B5563/FFFFFF?text=??"}
              alt={msg.user.name}
              className="w-10 h-10 rounded-full object-cover bg-gray-600"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-bold text-blue-300">{msg.user.name}</p>
                <p className="text-xs text-gray-500">{msg.createdAt?.toDate().toLocaleTimeString()}</p>
              </div>
              <p className="text-white mt-1">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 bg-gray-900 border-t border-gray-700 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
            <ArrowRight />
          </button>
        </form>
      </footer>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }`}</style>
    </div>
  );
}
