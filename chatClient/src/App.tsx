import React from "react";
import ChatComponent from "./components/chatComponent";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header only shown if the user is not signed in */}
      <SignedOut>
        <header className="bg-[#f07055] text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">FiryChat</h1>
            <div className="cursor-pointer">
              <SignInButton>
                <span className="px-4 py-2 bg-white text-[#f07055] rounded-md font-semibold hover:bg-gray-100 transition-colors">
                  Sign In
                </span>
              </SignInButton>
            </div>
          </div>
        </header>
      </SignedOut>

      {/* Main content */}
      <main className="flex-grow">
        <SignedIn>
          <ChatComponent />
        </SignedIn>
      </main>
    </div>
  );
};

export default App;
