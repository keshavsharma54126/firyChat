import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { UserButton, useUser } from "@clerk/clerk-react";
import axios from "axios";
import io, { Socket } from "socket.io-client";

interface User {
  id: number;
  username: string;
  email: string;
  imageUrl: string;
  status: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  conversationId: number;
  createdAt: string;
  status: string;
}

const ChatComponent = () => {
  const [activeBadge, setActiveBadge] = useState("All");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [messageStatuses, setMessageStatuses] = useState<{
    [key: number]: string;
  }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [userStatuses, setUserStatuses] = useState<{ [key: number]: string }>(
    {}
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      synchronizeUserData(user);
    }
    getUsers();

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("loadMessages", (loadedMessages: Message[]) => {
      setMessages(loadedMessages);
    });

    socketRef.current.on("newMessage", (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socketRef.current.on("messageStatus", (messageId, status) => {
      setMessageStatuses((prev) => ({ ...prev, [messageId]: status }));
    });

    socketRef.current.on("statusUpdate", ({ userId, status }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isLoaded, user, selectedUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUser]);

  useEffect(() => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit("userConnected", { id: currentUser.id });
    }
  }, [currentUser]);

  const synchronizeUserData = async (user: any) => {
    try {
      const res = await axios.post("http://localhost:5000/signup", {
        username: user.username,
        email: user.primaryEmailAddress?.emailAddress,
        googleId: user.externalAccounts?.[0].id,
        imageUrl: user.externalAccounts?.[0].imageUrl,
      });

      setCurrentUser(res.data.user);
      console.log("User synchronized:", res.data.user);
    } catch (e) {
      console.error("Error while adding user to database", e);
    }
  };

  const getUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users");
      setUsers(res.data);
    } catch (e) {
      console.error("Error while getting users", e);
    }
  };

  const handleBadgeClick = (badge: string) => {
    setActiveBadge(badge);
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    try {
      const res = await axios.post("http://localhost:5000/conversations", {
        user1Id: currentUser?.id,
        user2Id: user.id,
      });
      setConversationId(res.data.conversation.id);
      if (socketRef.current) {
        socketRef.current.emit("join", res.data.conversation.id);
      }
    } catch (e) {
      console.error("Error while creating conversation", e);
    }
  };

  const handleSendMessage = () => {
    if (
      inputMessage.trim() === "" ||
      !currentUser ||
      !selectedUser ||
      !conversationId
    ) {
      return;
    }

    const newMessage = {
      content: inputMessage,
      senderId: currentUser.id,
      recipientId: selectedUser.id,
      conversationId: conversationId,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", newMessage);
      setInputMessage("");
    } else {
      console.error("Socket is not connected.");
    }
  };

  const handleTyping = useCallback(() => {
    if (socketRef.current && currentUser && selectedUser) {
      socketRef.current.emit("typing", {
        userId: currentUser.id,
        recipientId: selectedUser.id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stopTyping", {
          userId: currentUser.id,
          recipientId: selectedUser.id,
        });
      }, 1000);
    }
  }, [currentUser, selectedUser]);

  const markMessageAsRead = useCallback(
    (messageId: number) => {
      if (socketRef.current && conversationId) {
        socketRef.current.emit("markAsRead", { messageId, conversationId });
      }
    },
    [conversationId]
  );
  const handleSearch = async (username: string) => {
    try {
      if (username.trim() === "") {
        getUsers();
      } else {
        username = username.trim();
        const res = await axios.get(
          `http://localhost:5000/getUser/${username}`
        );
        const userArray = [];
        userArray.push(res.data);
        setUsers(userArray);
      }
    } catch (e) {
      console.error("erro while seraching", e);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r flex flex-col">
        <Card className="flex-grow flex flex-col overflow-hidden">
          <div className="p-3 flex flex-row items-center">
            <div className="mr-2 mt-2">
              <UserButton />
            </div>
            <div className="relative flex-grow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute top-1/2 left-3 transform -translate-y-1/2 size-6 text-gray-500">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <Input
                placeholder="Search"
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
                className="pl-10 pr-4 shadow-md bg-gray-100 border border-gray-300 rounded-md py-2 focus:ring-0 focus:border-none"
              />
            </div>
          </div>
          <Separator />
          <div className="p-3 flex items-center gap-2">
            {["All", "Unread", "Archived", "Blocked"].map((badge) => (
              <Badge
                key={badge}
                variant={activeBadge === badge ? "main" : "second"}
                onClick={() => handleBadgeClick(badge)}
                className="cursor-pointer">
                {badge}
              </Badge>
            ))}
          </div>
          <Separator />
          <ScrollArea className="flex-grow p-4 overflow-y-auto">
            {users.map((u) => (
              <div key={u.id}>
                <div
                  className="flex items-center gap-2 mb-4 cursor-pointer mt-3"
                  onClick={() => handleUserClick(u)}>
                  <Avatar className="mr-2">
                    <AvatarImage src={u.imageUrl} alt={u.username[0]} />
                    <AvatarFallback>{u.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{u.username}</div>
                    <div className="text-sm text-gray-500">
                      {userStatuses[u.id] || "offline"}
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </ScrollArea>
        </Card>
      </div>
      <div className="w-2/3 flex flex-col">
        <Card className="flex-grow flex flex-col overflow-hidden">
          <div className="flex items-center p-3 border-b bg-gray-100">
            <Avatar className="mr-2">
              <AvatarImage
                src={selectedUser?.imageUrl || "https://github.com/shadcn.png"}
                alt={selectedUser?.username || "User"}
              />
              <AvatarFallback>
                {selectedUser?.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">
                {selectedUser?.username || "Select a user"}
              </div>
              <div className="text-sm text-gray-500">
                {userStatuses[selectedUser?.id || 0] || "offline"}
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto border">
            {messages.map((msg, index) => (
              <div className="flex flex-col">
                <div
                  key={index}
                  onMouseEnter={() => {
                    if (msg.senderId !== currentUser?.id) {
                      markMessageAsRead(msg.id);
                    }
                  }}
                  className={`flex ${
                    msg.senderId === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                  } mb-2`}>
                  <div
                    className={`bg-${
                      msg.senderId === currentUser?.id
                        ? "[#f07055] text-white"
                        : "gray-100"
                    } p-3 rounded-md max-w-sm md:max-w-md lg:max-w-lg 2xl:max-w-2xl`}>
                    {msg.content}
                  </div>
                </div>
                {msg.senderId === currentUser?.id && (
                  <div
                    className={`flex ${
                      msg.senderId === currentUser?.id
                        ? "justify-end"
                        : "justify-start"
                    } mb-6`}>
                    {messageStatuses[msg.id] || msg.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Separator />
        <Card className="border-none shadow-none flex-shrink-0">
          <div className="flex items-center p-4">
            <Input
              type="text"
              placeholder="Type a message"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              className="mr-2"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              className="bg-[#f07055] text-white">
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatComponent;
