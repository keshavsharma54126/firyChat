import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { UserButton } from "@clerk/clerk-react";

const ChatComponent = () => {
  const [activeBadge, setActiveBadge] = useState("All");

  const badges = ["All", "Unread", "Archived", "Blocked"];

  const handleBadgeClick = (badge: any) => {
    setActiveBadge(badge);
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
                className="pl-10 pr-4 shadow-md bg-gray-100 border border-gray-300 rounded-md py-2 focus:ring-0 focus:border-none "
              />
            </div>
          </div>
          <Separator />
          <div className="p-3 flex items-center gap-2">
            {badges.map((badge) => (
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
            {/* Add the list of conversations here */}
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="mr-2">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold">Kristine</div>
                <div className="text-sm text-gray-500">
                  4th Hello, I wanted to know more about the product design
                  position opened at Atlassian.
                </div>
              </div>
            </div>
            <Separator />
            {/* Repeat above block for each conversation */}
          </ScrollArea>
        </Card>
      </div>
      <div className="w-2/3 flex flex-col">
        <Card className="flex-grow flex flex-col overflow-hidden">
          <div className="flex items-center p-3 border-b bg-gray-100">
            <Avatar className="mr-2">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">Kristine</div>
              <div className="text-sm text-gray-500">Typing...</div>
            </div>
          </div>
          <ScrollArea className="flex-grow p-4 overflow-y-auto">
            {/* Add the chat messages here */}
            <div className="mb-4">
              <div className="bg-gray-100 p-3 rounded-md mb-2">
                Hello, I wanted to know more about the product design position
                opened at Atlassian.
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end mb-2">
                Sure, tell us. What do you wanna know?
              </div>
              <div className="bg-gray-100 p-3 rounded-md mb-2">
                Take this part of your letter seriously because it's likely one
                of your first genuine opportunities to make a personal, positive
                impression on a prospective employer. You want your words to
                invite them to keep reading and to convey exactly why you're the
                best choice for their open position. Review your language to
                ensure it's concise and informative. If you're applying to
                multiple positions, take great care to edit your letter so that
                the first paragraph is personal and relevant to the exact
                position you want.
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end mb-2">
                You've a good folio
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end">
                However we're looking for someone with a little more experience!
              </div>
              <div className="text-sm text-gray-500 self-end mt-2">3 days</div>
              <div className="bg-gray-100 p-3 rounded-md mb-2">
                Hello, I wanted to know more about the product design position
                opened at Atlassian.
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end mb-2">
                Sure, tell us. What do you wanna know?
              </div>
              <div className="bg-gray-100 p-3 rounded-md mb-2">
                Take this part of your letter seriously because it's likely one
                of your first genuine opportunities to make a personal, positive
                impression on a prospective employer. You want your words to
                invite them to keep reading and to convey exactly why you're the
                best choice for their open position. Review your language to
                ensure it's concise and informative. If you're applying to
                multiple positions, take great care to edit your letter so that
                the first paragraph is personal and relevant to the exact
                position you want.
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end mb-2">
                You've a good folio
              </div>
              <div className="bg-[#f07055] text-white p-3 rounded-md self-end">
                However we're looking for someone with a little more experience!
              </div>
              <div className="text-sm text-gray-500 self-end mt-2">3 days</div>
            </div>
            {/* Repeat above block for each chat message */}
          </ScrollArea>
        </Card>
        <Separator />
        <div className="relative p-4 flex">
          <div className="flex-grow relative">
            <Input
              placeholder="Type a message..."
              className="w-full bg-gray-100 border rounded-md pl-6 pr-4 py-2 focus:ring-0 focus:border-none"
            />
            <Button
              variant="ghost"
              className="absolute inset-y-0 right-0 p-3 flex items-center cursor-pointer bg-[#efd5d0] hover:bg-[#dcbbb6]"
              aria-label="Add Multimedia">
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
            <Button
              variant="ghost"
              className="absolute inset-y-0 right-12 p-3 flex items-center cursor-pointer"
              aria-label="Add Multimedia">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6 text-[#f07055] hover:text-[#f54d2c] hover:mr-1 hover:mb-1">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
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
