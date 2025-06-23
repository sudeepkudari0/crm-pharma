"use client";

import { useState, useEffect } from "react";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import {
  Loader2,
  CalendarIcon as LucideCalendarIcon,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { nextActionTypes, type ActivityWithRelations } from "@/types";
import { NextActionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const editNextActionSchema = z
  .object({
    nextActionType: z.string().optional().nullable(),
    nextActionDetails: z.string().optional().nullable(),
    nextActionDate: z
      .string()
      .datetime({ offset: true, message: "Invalid date format." })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        (data.nextActionType || data.nextActionDetails) &&
        !data.nextActionDate
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "A due date is required if specifying a next action type or details.",
      path: ["nextActionDate"],
    }
  );

type EditNextActionFormData = z.infer<typeof editNextActionSchema>;

interface EditNextActionDialogProps {
  activity: ActivityWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNextActionDialog({
  activity,
  open,
  onOpenChange,
}: EditNextActionDialogProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    NextActionStatus | "SAVE" | null
  >(null);

  const form = useForm<EditNextActionFormData>({
    resolver: zodResolver(editNextActionSchema),
  });

  useEffect(() => {
    if (open && activity) {
      form.reset({
        nextActionType: activity.nextActionType || null,
        nextActionDetails: activity.nextActionDetails || "",
        nextActionDate: activity.nextActionDate
          ? dayjs(activity.nextActionDate).toISOString()
          : null,
      });
    }
  }, [open, activity, form]);

  const handleStatusUpdate = async (newStatus: NextActionStatus) => {
    setLoadingAction(newStatus);
    const payload: any = {
      nextActionStatus: newStatus,
    };

    if (newStatus === NextActionStatus.COMPLETED) {
      payload.nextActionCompletedAt = new Date().toISOString();
    } else if (newStatus === NextActionStatus.CANCELLED) {
    }

    try {
      const response = await fetch(
        `/api/activities/${activity.id}/next-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to update next action to ${newStatus}`
        );
      }

      toast.success(`Next action marked as ${newStatus.toLowerCase()}.`);
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const onSaveChanges = async (data: EditNextActionFormData) => {
    setLoadingAction("SAVE");

    const isReschedule =
      data.nextActionDate &&
      activity.nextActionDate &&
      dayjs(data.nextActionDate).toISOString() !==
        dayjs(activity.nextActionDate).toISOString() &&
      data.nextActionType === activity.nextActionType &&
      data.nextActionDetails === (activity.nextActionDetails || "");

    const payload = {
      ...data,
      nextActionDate: data.nextActionDate
        ? dayjs(data.nextActionDate).toISOString()
        : null,

      nextActionStatus: isReschedule
        ? NextActionStatus.RESCHEDULED
        : NextActionStatus.PENDING,
      nextActionReminderSent: false,
      nextActionCompletedAt: null,
    };

    if (
      isReschedule &&
      payload.nextActionStatus !== NextActionStatus.RESCHEDULED
    ) {
      payload.nextActionStatus = NextActionStatus.PENDING;
    }

    try {
      const response = await fetch(
        `/api/activities/${activity.id}/next-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to save next action changes."
        );
      }

      toast.success("Next action details updated successfully.");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Next Action</DialogTitle>
          <DialogDescription>
            Update, reschedule, complete, or cancel the next action for
            activity:
            <span className="font-semibold">"{activity.subject}"</span>
            <br />
            <span className="text-xs text-muted-foreground">
              Current Status: {activity.nextActionStatus || "PENDING"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSaveChanges)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 items-start">
              <FormField
                control={form.control}
                name="nextActionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Action Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {nextActionTypes.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextActionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      New Due Date
                      {(form.watch("nextActionType") ||
                        form.watch("nextActionDetails")) && (
                        <span className="text-red-500">*</span>
                      )}
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
                              <span>Pick new date & time</span>
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
                              : dayjs().hour(9).minute(0);
                            field.onChange(
                              newDate
                                .hour(currentTime.hour())
                                .minute(currentTime.minute())
                                .second(0)
                                .toISOString()
                            );
                          }}
                          disabled={(date) =>
                            date < dayjs().subtract(1, "day").toDate()
                          }
                          initialFocus
                        />
                        <div className="p-2 border-t flex items-center gap-2">
                          <Input
                            type="time"
                            className="text-xs"
                            value={
                              field.value
                                ? dayjs(field.value).format("HH:mm")
                                : "09:00"
                            }
                            onChange={(e) => {
                              const [h, m] = e.target.value
                                .split(":")
                                .map(Number);
                              const d = field.value
                                ? dayjs(field.value)
                                : dayjs();
                              field.onChange(
                                d.hour(h).minute(m).second(0).toISOString()
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
              control={form.control}
              name="nextActionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Details
                    {form.watch("nextActionType") === "CUSTOM_TASK" && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specific details about the next action..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt- gap-2 sm:space-x-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!!loadingAction}>
                {loadingAction === "SAVE" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes / Reschedule
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <div className="flex items-center">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="mx-4 text-sm ">OR</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate(NextActionStatus.CANCELLED)}
              disabled={
                !!loadingAction ||
                activity.nextActionStatus === NextActionStatus.CANCELLED
              }
            >
              {loadingAction === NextActionStatus.CANCELLED ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Cancelled
            </Button>
            <Button
              variant="default"
              onClick={() => handleStatusUpdate(NextActionStatus.COMPLETED)}
              className="bg-green-600 hover:bg-green-700"
              disabled={
                !!loadingAction ||
                activity.nextActionStatus === NextActionStatus.COMPLETED
              }
            >
              {loadingAction === NextActionStatus.COMPLETED ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Completed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
