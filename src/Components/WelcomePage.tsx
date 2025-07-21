"use client";
import { useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Camera, Edit, Loader2, PlusCircle, Save } from "lucide-react";
export default function WelcomePage({ db, session, onEnterChat, onLogout, onProfileUpdate }: any) {
  const [localProfile, setLocalProfile] = useState(session.profile);
  const [isEditingName, setIsEditingName] = useState(false);
  const [enterRoomId, setEnterRoomId] = useState("");
  const [enterRoomPassword, setEnterRoomPassword] = useState("");
  const [createRoomId, setCreateRoomId] = useState("");
  const [createRoomPassword, setCreateRoomPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<any>(null);

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 750 * 1024) {
      alert("Image too large (max 750KB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newPictureUrl = reader.result;
      try {
        const userRef = doc(db, "users", session.userId);
        await updateDoc(userRef, { profilePictureUrl: newPictureUrl });
        onProfileUpdate({ profilePictureUrl: newPictureUrl });
        setLocalProfile((prev: any) => ({ ...prev, profilePictureUrl: newPictureUrl }));
      } catch (err) {
        console.error("Failed to update profile picture:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (localProfile.name.trim() === "") return;
    try {
      const userRef = doc(db, "users", session.userId);
      await updateDoc(userRef, { name: localProfile.name });
      onProfileUpdate({ name: localProfile.name });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    }
  };

  const handleEnterRoom = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const roomRef = doc(db, "rooms", enterRoomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists() && roomSnap.data().password === enterRoomPassword) {
        onEnterChat(enterRoomId);
      } else {
        setError("Invalid Room ID or Password.");
      }
    } catch (err) {
      console.error("Room validation error:", err);
      setError("Failed to connect to room.");
    }
    setIsLoading(false);
  };

  const handleCreateRoom = async (e: any) => {
    e.preventDefault();
    if (!createRoomId || !createRoomPassword) {
      setError("Please provide an ID and password for the new room.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const roomRef = doc(db, "rooms", createRoomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        setError("A room with this ID already exists.");
      } else {
        await setDoc(roomRef, {
          name: createRoomId,
          password: createRoomPassword,
        });
        setSuccess(`Room '${createRoomId}' created successfully!`);
        setCreateRoomId("");
        setCreateRoomPassword("");
      }
    } catch (err) {
      console.error("Room creation error:", err);
      setError("Failed to create room.");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg border-gray-700">
        <div className="flex justify-between items-start">
          <h2 className="text-3xl font-bold">Welcome</h2>
          <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white">
            Logout
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <img
              src={localProfile.profilePictureUrl || "https://placehold.co/128x128/374151/9CA3AF?text=No+Image"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={32} />
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          </div>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <input
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-bold bg-gray-700 p-1 rounded"
                />
                <button onClick={handleNameSave}>
                  <Save size={20} className="text-green-400" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold">{localProfile.name}</h3>
                <button onClick={() => setIsEditingName(true)}>
                  <Edit size={20} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleEnterRoom} className="space-y-4 border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-center">Enter a Room</h3>
          <div>
            <label>Room ID</label>
            <input
              value={enterRoomId}
              onChange={(e) => setEnterRoomId(e.target.value)}
              required
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          <div>
            <label>Room Password</label>
            <input
              type="password"
              value={enterRoomPassword}
              onChange={(e) => setEnterRoomPassword(e.target.value)}
              required
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
            {isLoading ? <Loader2 className="mx-auto animate-spin" /> : "Enter Chat"}
          </button>
        </form>

        <form onSubmit={handleCreateRoom} className="space-y-4 border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-center">Or Create a New Room</h3>
          <div>
            <label>New Room ID</label>
            <input
              value={createRoomId}
              onChange={(e) => setCreateRoomId(e.target.value)}
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          <div>
            <label>New Room Password</label>
            <input
              type="password"
              value={createRoomPassword}
              onChange={(e) => setCreateRoomPassword(e.target.value)}
              className="w-full mt-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <PlusCircle size={20} /> Create Room
              </>
            )}
          </button>
        </form>
        {error && <p className="text-red-400 text-center pt-4">{error}</p>}
        {success && <p className="text-green-400 text-center pt-4">{success}</p>}
      </div>
    </div>
  );
}
