import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import SignedInApp from "./SignedInApp";

Amplify.configure(outputs);

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const owner = user?.username ?? "unknown-owner";
        const safeSignOut = (signOut ?? (() => {})) as () => void;
        return <SignedInApp owner={owner} signOut={safeSignOut} />;
      }}
    </Authenticator>
  );
}
