import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { UserButton, useUser } from "@clerk/clerk-react";
import axios from "axios";
import io from "socket.io-client";

interface User {
  id: number;
  username: string;
  email: string;
  imageUrl: string;
}

interface Message {
  content: string;
  sender: string;
  recipientId: number;
}

const ChatComponent = () => {
  const [activeBadge, setActiveBadge] = useState("All");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user, isLoaded } = useUser();
  const socket = io("http://localhost:5000"); // Ensure this URL matches your server

  useEffect(() => {
    if (isLoaded && user) {
      synchronizeUserData(user);
    }
    getUsers();

    socket.on("newMessage", (msg: Message) => {
      console.log("New message received:", msg); // Debugging
      if (selectedUser && msg.recipientId === selectedUser.id) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    });

    return () => {
      socket.disconnect(); // Cleanup on unmount
    };
  }, [isLoaded, user, selectedUser]);

  const synchronizeUserData = async (user: any) => {
    try {
      console.log("Request sent");
      console.log(user);
      await axios.post("http://localhost:5000/signup", {
        username: user.username,
        email: user.primaryEmailAddress?.emailAddress,
        googleId: user.externalAccounts?.[0].id,
        imageUrl: user.externalAccounts?.[0].imageUrl,
      });
    } catch (e) {
      console.error("Error while adding user to database", e);
    }
  };

  const getUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users");
      console.log(res.data);
      setUsers(res.data);
    } catch (e) {
      console.error("Error while getting users", e);
    }
  };

  const fetchMessages = async (recipientId: number) => {
    try {
      const res = await axios.get("http://localhost:5000/messages", {
        params: {
          recipientId,
          senderId: user?.id,
        },
      });
      setMessages(res.data);
    } catch (e) {
      console.error("Error fetching messages", e);
    }
  };

  const handleBadgeClick = (badge: string) => {
    setActiveBadge(badge);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    fetchMessages(user.id);
  };

  const handleSendMessage = () => {
    if (message.trim() !== "" && user && selectedUser) {
      const newMessage: Message = {
        content: message,
        sender: user.username as string,
        recipientId: selectedUser.id,
      };
      console.log("Sending message:", newMessage); // Debugging
      socket.emit("sendMessage", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
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
              <div
                key={u.id}
                className="flex items-center gap-2 mb-4 cursor-pointer"
                onClick={() => handleUserClick(u)}>
                <Avatar className="mr-2">
                  <AvatarImage src={u.imageUrl} alt={u.username[0]} />
                  <AvatarFallback>{u.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold">{u.username}</div>
                </div>
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
              <div className="text-sm text-gray-500">Typing...</div>
            </div>
          </div>
          <ScrollArea className="flex-grow p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex justify-${
                  msg.sender === user?.username ? "end" : "start"
                }`}>
                <div
                  className={`bg-${
                    msg.sender === user?.username
                      ? "[#f07055] text-white"
                      : "gray-100"
                  } p-3 rounded-md max-w-sm md:max-w-md lg:max-w-lg 2xl:max-w-2xl`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </ScrollArea>
        </Card>
        <Separator />
        <div className="relative p-4 flex">
          <div className="flex-grow relative">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="w-full bg-gray-100 border rounded-md pl-6 pr-4 py-2 focus:ring-0 focus:border-none"
            />
            <Button
              variant="ghost"
              onClick={handleSendMessage}
              className="absolute inset-y-0 right-0 p-3 flex items-center cursor-pointer bg-[#efd5d0] hover:bg-[#dcbbb6]"
              aria-label="Send Message">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6 text-[#f07055]">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
