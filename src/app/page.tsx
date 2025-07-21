"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setLogLevel, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import LoginPage from "@/Components/LoginPage";
import ChatRoom from "@/Components/ChatRoom";
import { firebaseConfig } from "@/Constants";
import WelcomePage from "@/Components/WelcomePage";

export default function Home() {
  const [db, setDb] = useState<any>(null);
  const [_, setIsAuthReady] = useState(false);
  const isAuthReady = true;
  // --- Session State with localStorage Persistence ---
  const [session, setSession] = useState(() => {
    // On initial load, try to get the session from localStorage.
    try {
      const savedSession = localStorage.getItem("chat-session");
      return savedSession ? JSON.parse(savedSession) : { userId: null, token: null, profile: null };
    } catch (error) {
      console.error("Could not parse session from localStorage", error);
      return { userId: null, token: null, profile: null };
    }
  });

  // The initial page is determined by whether a session was found in localStorage.
  const [page, setPage] = useState(session.token ? "welcome" : "login");
  const [roomCode, setRoomCode] = useState("");

  // --- Firebase Initialization & Anonymous Auth ---
  useEffect(() => {
    setLogLevel("debug");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const dbInstance = getFirestore(app);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthReady(true);
      } else {
        signInAnonymously(auth).catch((error) => console.error("Anonymous sign-in failed:", error));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Page Navigation Handlers ---
  const handleLoginSuccess = (userId: any, token: any, profile: any) => {
    const newSession = { userId, token, profile };
    // 1. Save the new session to localStorage.
    localStorage.setItem("chat-session", JSON.stringify(newSession));
    // 2. Update the state.
    setSession(newSession);
    setPage("welcome");
  };

  const handleEnterChat = (roomId: any) => {
    setRoomCode(roomId);
    setPage("chat");
  };

  const handleLogout = async () => {
    if (session.userId) {
      const userRef = doc(db, "users", session.userId);
      await updateDoc(userRef, { userToken: null });
    }
    // 1. Remove the session from localStorage.
    localStorage.removeItem("chat-session");
    // 2. Clear the state.
    setSession({ userId: null, token: null, profile: null });
    setRoomCode("");
    setPage("login");
  };

  const updateProfileInSession = (newProfileData: any) => {
    setSession((prev: any) => {
      const newSession = { ...prev, profile: { ...prev.profile, ...newProfileData } };
      // Also update the session in localStorage when profile changes.
      localStorage.setItem("chat-session", JSON.stringify(newSession));
      return newSession;
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {page === "login" && <LoginPage db={db} onLoginSuccess={handleLoginSuccess} />}
      {page === "welcome" && (
        <WelcomePage db={db} session={session} onEnterChat={handleEnterChat} onLogout={handleLogout} onProfileUpdate={updateProfileInSession} />
      )}
      {page === "chat" && <ChatRoom db={db} roomCode={roomCode} session={session} onLogout={handleLogout} />}
    </div>
  );
}
