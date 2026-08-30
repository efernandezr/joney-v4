import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface BrainEntry {
  id: string;
  type: "fact" | "preference" | "lesson" | "note";
  title: string;
  body: string;
  status: "proposed" | "kept";
}

/**
 * A single brain entry: type badge, title, body, inline edit (pencil icon
 * swaps to title/body inputs, saved via update-brain-entry), and delete
 * behind a confirm dialog. Invalidates list-brain-entries on settle so both
 * the proposals inbox and kept sections stay current after any mutation.
 */
export function BrainEntryCard({ entry }: { entry: BrainEntry }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["action", "list-brain-entries"] });
  }

  const update = useActionMutation("update-brain-entry", {
    onSettled: invalidate,
    onError: () => toast.error("Couldn't save the memory — try again."),
  });
  const remove = useActionMutation("delete-brain-entry", {
    onSettled: invalidate,
    onError: () => toast.error("Couldn't delete the memory — try again."),
  });

  function startEditing() {
    setTitle(entry.title);
    setBody(entry.body);
    setEditing(true);
  }

  function save() {
    update.mutate({ id: entry.id, title, body });
    setEditing(false);
  }

  return (
    <div
      data-testid="brain-entry-card"
      className="space-y-2 rounded-md border border-border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="capitalize">
          {entry.type}
        </Badge>
        {!editing && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Edit memory"
              onClick={startEditing}
            >
              <IconPencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              aria-label="Delete memory"
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Title"
          />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-label="Body"
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={update.isPending} onClick={save}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm font-medium">{entry.title}</div>
          <p className="text-sm text-muted-foreground">{entry.body}</p>
        </>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this memory? Your agent will forget it.
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              This permanently deletes the memory. It can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                remove.mutate({ id: entry.id });
                setConfirmDelete(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
