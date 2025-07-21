"use client";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
export default function LoginPage({ db, onLoginSuccess }: any) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userDataFromDb = userSnap.data();
        if (userDataFromDb.password === password) {
          // 1. Generate a new, unique token
          const token = crypto.randomUUID();
          // 2. Save the new token to the user's document in Firestore
          await updateDoc(userRef, { userToken: token });
          // 3. Start the session with the userId, the new token, and profile data
          onLoginSuccess(userSnap.id, token, userDataFromDb);
        } else {
          setError("Incorrect password.");
        }
      } else {
        setError("User ID not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server.");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Secure Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label>User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {isLoading ? <Loader2 className="mx-auto animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
