"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { PhoneInput } from "@/components/ui/phone-input";
import type { UserWithRelations, UserRole } from "@/types";

interface EditUserDialogProps {
  user: UserWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssociateOption {
  value: string;
  label: string;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    territory: user.territory || "",
    isActive: user.isActive,
  });

  const [associates, setAssociates] = useState<AssociateOption[]>([]);
  const [selectedAssociates, setSelectedAssociates] = useState<string[]>(
    user.userAccess.map((user) => user.adminId)
  );

  useEffect(() => {
    if (formData.role === "ADMIN") {
      fetch("/api/admin/users/associates")
        .then((res) => res.json())
        .then((data) => {
          const allOptions = data.map((user: any) => ({
            value: user.id,
            label: user.name,
          }));

          setAssociates(allOptions);

          const alreadyLinkedIds = user.adminAccess.map((ua) => ua.userId);
          setSelectedAssociates(alreadyLinkedIds);
        })
        .catch((err) => {
          console.error("Error fetching associates:", err);
        });
    }
  }, [formData.role, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          adminAccess: selectedAssociates,
        }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => {
                  setFormData({ ...formData, role: value });
                  setSelectedAssociates([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSOCIATE">Associate</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Whatsapp Number <span className="text-red-500">*</span>
              </Label>
              <PhoneInput
                defaultCountry="IN"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                className="rounded-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="territory">Territory</Label>
            <Input
              id="territory"
              value={formData.territory}
              onChange={(e) =>
                setFormData({ ...formData, territory: e.target.value })
              }
              placeholder="e.g., North Region, South Region"
            />
          </div>

          {formData.role === "ADMIN" && (
            <div className="space-y-2">
              <Label>Associates</Label>
              <Combobox
                selectedValues={selectedAssociates}
                options={associates}
                addValue={(val) =>
                  setSelectedAssociates([...selectedAssociates, val])
                }
                removeValue={(val) =>
                  setSelectedAssociates(
                    selectedAssociates.filter((id) => id !== val)
                  )
                }
                placeholder="Select associates"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <Label htmlFor="isActive">Active User</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
