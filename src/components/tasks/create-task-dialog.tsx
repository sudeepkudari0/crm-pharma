"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, CalendarIcon as LucideCalendarIcon } from "lucide-react";
import type { Prospect, User as UserType } from "@/types";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { TaskType } from "@prisma/client";

enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}
enum UserRole {
  ASSOCIATE = "ASSOCIATE",
  ADMIN = "ADMIN",
  SYS_ADMIN = "SYS_ADMIN",
}

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Invalid date format." })
    .optional()
    .nullable(),
  assignedToId: z.string().optional().nullable(),
  prospectId: z.string().optional().nullable(),
  type: z.nativeEnum(TaskType).default(TaskType.TASK),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProspectId?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProspectId,
}: CreateTaskDialogProps) {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole | undefined;

  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserType[]>([]);
  const router = useRouter();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: Priority.MEDIUM,
      dueDate: null,
      assignedToId: null,
      prospectId: defaultProspectId || null,
      type: TaskType.TASK,
    },
  });
  const { control, handleSubmit, reset, watch } = form;

  const fetchProspects = useCallback(async () => {
    try {
      const response = await fetch("/api/prospects?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch prospects");
      const data = await response.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Could not load prospects.");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();

      const filteredUsers = (data.users || []).filter(
        (user: UserType) => user.role !== UserRole.SYS_ADMIN
      );
      setAssignableUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Could not load users.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProspects();
      fetchUsers();

      form.reset({
        title: "",
        description: "",
        priority: Priority.MEDIUM,
        dueDate: null,
        assignedToId: null,
        prospectId: defaultProspectId || null,
        type: TaskType.TASK,
      });
    }
  }, [open, fetchProspects, fetchUsers, defaultProspectId, form]);

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);

    if (!session?.user?.id || !currentUserRole) {
      toast.error("User session not found. Please re-login.");
      setLoading(false);
      return;
    }

    let taskType: TaskType;
    const assignedUser = assignableUsers.find(
      (u) => u.id === data.assignedToId
    );
    const assignedUserRole = assignedUser?.role as UserRole | undefined;

    if (
      currentUserRole === UserRole.ADMIN &&
      assignedUserRole === UserRole.ASSOCIATE
    ) {
      taskType = TaskType.TASK;
    } else if (
      currentUserRole === UserRole.ASSOCIATE &&
      assignedUserRole === UserRole.ADMIN
    ) {
      taskType = TaskType.REQUEST;
    } else if (data.assignedToId === session.user.id) {
      taskType = TaskType.TASK;
    } else if (
      currentUserRole === UserRole.ADMIN &&
      assignedUserRole === UserRole.ADMIN
    ) {
      taskType = TaskType.TASK;
    } else if (
      currentUserRole === UserRole.ASSOCIATE &&
      assignedUserRole === UserRole.ASSOCIATE
    ) {
      taskType = TaskType.REQUEST;
    } else {
      taskType = TaskType.TASK;
    }

    const finalAssignedToId = data.assignedToId || session.user.id;
    if (!data.assignedToId && taskType === TaskType.REQUEST) {
      taskType = TaskType.TASK;
    }

    try {
      const payload = {
        ...data,
        dueDate: data.dueDate ? dayjs(data.dueDate).toISOString() : null,
        assignedToId: finalAssignedToId,
        prospectId: data.prospectId || null,
        type: taskType,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to create task" }));
        throw new Error(errorData.message || "Failed to create task");
      }

      toast.success(`Task ${taskType}ed successfully`);
      onOpenChange(false);

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the task..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Priority
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Priority).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Due Date
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              dayjs(field.value).format("MMM D, YYYY h:mm A")
                            ) : (
                              <span>Pick date & time</span>
                            )}
                            <LucideCalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            const newDate = dayjs(date);
                            const currentTime = field.value
                              ? dayjs(field.value)
                              : dayjs().hour(17).minute(0);
                            field.onChange(
                              newDate
                                .hour(currentTime.hour())
                                .minute(currentTime.minute())
                                .second(0)
                                .toISOString()
                            );
                          }}
                          initialFocus
                        />
                        <div className="p-2 border-t flex items-center gap-2">
                          <Input
                            type="time"
                            className="text-xs"
                            value={
                              field.value
                                ? dayjs(field.value).format("HH:mm")
                                : "17:00"
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value
                                .split(":")
                                .map(Number);
                              const currentDate = field.value
                                ? dayjs(field.value)
                                : dayjs();
                              field.onChange(
                                currentDate
                                  .hour(hours)
                                  .minute(minutes)
                                  .second(0)
                                  .toISOString()
                              );
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee (defaults to self)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assignableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} (
                          {user.role
                            ? user.role.replace("_", " ").toLowerCase()
                            : "No role"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If not selected, task will be assigned to you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="prospectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Prospect (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prospect" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prospects.map((prospect) => (
                        <SelectItem key={prospect.id} value={prospect.id}>
                          {prospect.name}
                          {prospect.company ? `- ${prospect.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6 flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
