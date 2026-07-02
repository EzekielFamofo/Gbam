import { createCliRenderer, } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Home } from "./screens/home";
import { NewSession } from "./screens/new-session";
import { Session } from "./screens/session";

const router = createMemoryRouter ([
  {//setting up a  memory-based router
    path: "/",
    element: <RootLayout />,
    children : [
      { index:true, element: <Home /> },// default view, home component
      { path: "sessions/new", element: <NewSession/> },// path to sessions/new
      { path: "sessions/:id", element: <Session/> },// a dynamic route, meaning :id can have multiple values, allowing the user to have multiple sessions
    ]
  },
]);

function App() {
  return <RouterProvider router={router} />
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,// doesnt close application on ctrl C yet
});
createRoot(renderer).render(<App />);
