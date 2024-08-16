import ChatComponent from "./components/chatComponent";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

const App = () => {
  return (
    <div>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <ChatComponent />
        </SignedIn>
      </header>
    </div>
  );
};

export default App;
