"use client";
import { useState } from "react";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, setLogLevel } from "firebase/firestore";
import { KeyRound, Loader2, LogIn, MessageSquare } from "lucide-react";
import { firebaseConfig } from "@/Constants";
export default function LoginPage({ db, onLoginSuccess }: any) {
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!roomCode || !password) {
      setError("Please enter both room code and password.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const roomRef = doc(db, `artifacts/${firebaseConfig.appId}/public/data/rooms`, roomCode);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists() && roomSnap.data().password === password) {
        onLoginSuccess(roomCode);
      } else if (roomSnap.exists()) {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Room code not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-blue-400" />
          <h2 className="mt-4 text-3xl font-bold text-white">Join a Chat Room</h2>
          <p className="mt-2 text-sm text-gray-400">
            Default room: <code className="bg-gray-700 p-1 rounded">general</code>, password:{" "}
            <code className="bg-gray-700 p-1 rounded">password123</code>
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="room-code" className="text-sm font-medium text-gray-300">
              Room Code
            </label>
            <div className="mt-1 relative">
              <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                id="room-code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg"
                placeholder="e.g., general"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="mt-1 relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Enter Chat"}
          </button>
        </form>
      </div>
    </div>
  );
}
