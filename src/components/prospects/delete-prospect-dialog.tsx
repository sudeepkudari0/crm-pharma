"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import type { ProspectWithRelations } from "@/types";

interface DeleteProspectDialogProps {
  prospect: ProspectWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProspectDialog({
  prospect,
  open,
  onOpenChange,
}: DeleteProspectDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/prospects/${prospect.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prospect");
      }

      toast({
        title: "Success",
        description: "Prospect deleted successfully",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prospect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Delete Prospect</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{prospect.name}</strong>?
            This action cannot be undone and will also delete all associated
            activities and tasks.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
