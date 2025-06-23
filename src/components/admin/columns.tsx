"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Shield,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import type { UserWithRelations } from "@/types";

const roleColors = {
  ASSOCIATE: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SYS_ADMIN: "bg-red-100 text-red-800",
};

const roleLabels = {
  ASSOCIATE: "Associate",
  ADMIN: "Administrator",
  SYS_ADMIN: "Super Admin",
};

export const usersColumns: ColumnDef<UserWithRelations>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.phone && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Phone className="h-3 w-3 mr-1" />
                {user.phone}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant="secondary" className={roleColors[role]}>
          <Shield className="h-3 w-3 mr-1" />
          {roleLabels[role]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "territory",
    header: "Territory",
    cell: ({ row }) => {
      const territory = row.original.territory;
      return territory ? (
        <div className="flex items-center text-sm">
          <MapPin className="h-3 w-3 mr-1" />
          {territory}
        </div>
      ) : (
        <span className="text-muted-foreground">Not assigned</span>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      return (
        <div className="text-sm">
          <p>{new Date(createdAt).toLocaleDateString()}</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      const router = useRouter();
      const { toast } = useToast();
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [showResetPasswordDialog, setShowResetPasswordDialog] =
        useState(false);
      const [loading, setLoading] = useState(false);

      const handleToggleStatus = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/admin/users/${user.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              isActive: !user.isActive,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update user status");
          }

          toast({
            title: "Success",
            description: `User ${
              user.isActive ? "deactivated" : "activated"
            } successfully`,
          });

          router.refresh();
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update user status",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowResetPasswordDialog(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus} disabled={loading}>
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    {loading ? "Deactivating..." : "Deactivate User"}
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {loading ? "Activating..." : "Activate User"}
                  </>
                )}
              </DropdownMenuItem>
              {user.role !== "SYS_ADMIN" && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <EditUserDialog
            key={`edit-${user.id}`}
            user={user}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <DeleteUserDialog
            key={`delete-${user.id}`}
            user={user}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          />
          <ResetPasswordDialog
            key={`reset-password-${user.id}`}
            user={user}
            open={showResetPasswordDialog}
            onOpenChange={setShowResetPasswordDialog}
          />
        </>
      );
    },
  },
];
