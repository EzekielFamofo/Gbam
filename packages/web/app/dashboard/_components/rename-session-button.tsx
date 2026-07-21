"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import type { DashboardSessionItem } from "@gbam/shared";

type Props = {
  sessionId: string;
  sessionTitle: string;
};

export function RenameSessionButton({ sessionId, sessionTitle }: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(sessionTitle);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const handleStartRename = () => setEditing(true);

  const handleCancel = () => {
    setNewTitle(sessionTitle);
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenaming(true);
    try {
      const response = await fetch(`/api/dashboard/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        throw new Error("Failed to rename session");
      }
      setEditing(false);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to rename session");
    } finally {
      setIsRenaming(false);
    }
  };

  if (!editing) {
    return (
      <Button variant="outline" size="sm" className="text-xs" onClick={handleStartRename}>
        Rename
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        className="border px-2 py-1 rounded text-xs"
        disabled={isRenaming}
        autoFocus
        maxLength={100}
      />
      <Button type="submit" variant="outline" size="sm" disabled={isRenaming || !newTitle.trim()}>
        {isRenaming ? "Renaming..." : "Save"}
      </Button>
      <Button variant="ghost" size="sm" type="button" onClick={handleCancel} disabled={isRenaming}>Cancel</Button>
    </form>
  );
}
