import { useRouteError } from "react-router";
import fs from "fs";

export const ErrorUI = () => {
  const error = useRouteError() as any;

  // 1. Force the error to the terminal immediately
  console.error("🚨 ROUTER CAUGHT ERROR:", error);

  // 2. Write the full stack trace to a file for review
  try {
    const stack = error?.stack || JSON.stringify(error);
    fs.writeFileSync('error-details.txt', `ERROR DETECTED:\n${stack}`);
  } catch (e) {
    console.error("Failed to write log", e);
  }

  return (
    <box padding={2}>
      <text fg="red">UI Crashed. Check 'error-details.txt' in your root folder.</text>
    </box>
  );
};