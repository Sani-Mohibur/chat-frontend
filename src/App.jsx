import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const socket = io("https://chat-backend-production-35bd.up.railway.app");

function App() {
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const toggleMenu = (id) => {
    if (openMenuId === id) setOpenMenuId(null);
    else setOpenMenuId(id);
  };

  const startEdit = (id) => {
    const msgToEdit = messages.find((m) => m.id === id);
    setEditingId(id);
    setEditedText(msgToEdit.text);
    setOpenMenuId(null); //Close dropdown
  };

  const submitEdit = () => {
    if (editedText.trim() === "") return;
    socket.emit("edit message", { id: editingId, newText: editedText });
    setEditingId(null);
    setEditedText("");
  };

  useEffect(() => {
    //Load previous messages
    socket.on("chat history", (history) => {
      setMessages(history);
    });

    //Listen new messages
    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("edit message", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
      );
    });

    socket.on("delete message", (deletedId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
    });

    //Cleanup
    return () => {
      socket.off("chat history");
      socket.off("chat message");
      socket.off("edit message");
      socket.off("delete message");
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() === "") return;

    socket.emit("chat message", { text: input.trim(), username });
    setInput("");
  };

  const editMessage = (id, newText) => {
    socket.emit("edit message", { id, newText });
  };

  const deleteMessage = (id) => {
    socket.emit("delete message", id);
    setOpenMenuId(null); //Close dropdown if open
  };

  if (!hasUsername) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="mb-4 text-xl font-bold">Enter your username</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          paceholder="Your name"
          className="border p-2 rounded mb-4"
        />
        <button
          disabled={!username.trim()}
          onClick={() => setHasUsername(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Start Chatting
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex
      flex-col
      h-screen
      max-w-xl
      mx-auto
      border
      border-gray-300
      rounded-md"
    >
      <header className="bg-blue-600 text-white p-4 m-4 text-center font-bold text-xl rounded">
        Real-Time Chat
      </header>
      <main className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-white p-2 rounded shadow max-w-[100%] relative"
          >
            {editingId === msg.id ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                />
                <button
                  onClick={submitEdit}
                  className="text-blue-600 font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                className={
                  msg.system ? "text-center text-gray-500 italic text-sm" : ""
                }
              >
                <strong>{msg.username || "Unknown"}: </strong>
                {msg.text}
              </div>
            )}

            {/*Three-dot button*/}
            <button
              disabled
              onClick={() => toggleMenu(msg.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &#x22EE;
            </button>

            {openMenuId === msg.id && (
              <div className="absolute top-6 right-2 bg-white border rounded shadow-md z-10">
                <button
                  onClick={() => startEdit(msg.id)}
                  className="block px-3 py-1 hover:bg-gray-100 w-full text-left"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDeleteId(msg.id)}
                  className="block px-3 py-1 hover:bg-gray-100 
                  w-full text-left text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </main>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg space-y-4 w-80 text-center">
            <p className="text-lg font-semibold">
              Are you sure you want to delete this message?
            </p>
            <div className="flex justify-around mt-4">
              <button
                onClick={() => {
                  deleteMessage(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="bg-red-500 text-white px-8 py-2 rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-4 border-t border-gray-300 flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2 
          focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-8 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
