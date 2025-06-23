"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  CalendarIcon as LucideCalendarIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import type { ActivityWithRelations, Prospect } from "@/types";
import { products as productOptions } from "@/constant/products";

const quickNextActions = [
  {
    label: "Follow-up Call in 1 Day",
    type: "CALL_PROSPECT",
    details: "Follow-up call",
    daysOffset: 1,
  },
  {
    label: "Follow-up Email in 3 Days",
    type: "EMAIL_PROSPECT",
    details: "Follow-up email",
    daysOffset: 3,
  },
  {
    label: "Meeting Next Week",
    type: "SCHEDULE_MEETING",
    details: "Schedule meeting",
    daysOffset: 7,
  },
  {
    label: "Self Reminder Next Week",
    type: "WHATSAPP_SELF",
    details: "General self-reminder",
    daysOffset: 7,
  },
];

const nextActionTypes = [
  { value: "CALL_PROSPECT", label: "Call Prospect" },
  { value: "EMAIL_PROSPECT", label: "Email Prospect" },
  { value: "SCHEDULE_MEETING", label: "Schedule Meeting" },
  { value: "SEND_SAMPLES", label: "Send Samples" },
  { value: "WHATSAPP_SELF", label: "WhatsApp Reminder (Self)" },
  { value: "CUSTOM_TASK", label: "Custom Task" },
];

const sampleItemSchema = z.object({
  productId: z.string().min(1, "Product selection is required."),
  quantity: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null
        ? undefined
        : parseInt(String(val), 10),
    z
      .number({ invalid_type_error: "Quantity must be a number." })
      .min(1, "Quantity must be at least 1 strip.")
  ),
});

const formSchema = z
  .object({
    type: z.enum([
      "CALL",
      "EMAIL",
      "MEETING",
      "WHATSAPP",
      "VISIT",
      "FOLLOW_UP",
      "PRESENTATION",
      "SAMPLE_DROP",
      "ORDER_COLLECTION",
      "OTHER",
    ]),
    subject: z
      .string()
      .min(2, { message: "Subject must be at least 2 characters." }),
    description: z.string().optional().nullable(),
    duration: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : parseInt(String(val), 10),
      z
        .number({ invalid_type_error: "Duration must be a number." })
        .positive("Duration must be positive.")
        .optional()
        .nullable()
    ),
    outcome: z.string().optional().nullable(),

    nextActionType: z.string().optional().nullable(),
    nextActionDetails: z.string().optional().nullable(),
    nextActionDate: z
      .string()
      .datetime({
        offset: true,
        message: "Invalid date format for Next Action Date.",
      })
      .optional()
      .nullable(),

    prospectId: z.string().min(1, { message: "Prospect is required" }),
    scheduledAt: z
      .string()
      .datetime({
        offset: true,
        message: "Invalid date format for Activity Date.",
      })
      .optional()
      .nullable(),
    samplesProvided: z.array(sampleItemSchema).optional().nullable(),
    orderDiscussed: z.boolean().optional().default(false),
    orderAmount: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : parseFloat(String(val)),
      z
        .number({ invalid_type_error: "Order amount must be a number." })
        .positive("Order amount must be positive.")
        .optional()
        .nullable()
    ),
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
        "Next Action Due Date is required if a next action is specified.",
      path: ["nextActionDate"],
    }
  )
  .refine(
    (data) => {
      if (
        data.nextActionType === "CUSTOM_TASK" &&
        (!data.nextActionDetails || data.nextActionDetails.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Details are required for custom tasks.",
      path: ["nextActionDetails"],
    }
  );

interface EditActivityDialogProps {
  activity: ActivityWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditActivityDialog({
  activity,
  open,
  onOpenChange,
}: EditActivityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [productToAdd, setProductToAdd] = useState<string>("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "samplesProvided",
  });

  const fetchProspects = useCallback(async () => {
    try {
      const response = await fetch("/api/prospects");
      if (!response.ok) throw new Error("Failed to fetch prospects");
      const data = await response.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Could not load prospects.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProspects();
      if (activity) {
        let initialSamples: z.infer<typeof sampleItemSchema>[] = [];
        if (Array.isArray(activity.samplesProvided)) {
          initialSamples = (activity.samplesProvided as any[])
            .map((s: any) => ({
              productId: s.productId || "",
              quantity: typeof s.quantity === "number" ? s.quantity : 1,
            }))
            .filter((s) => s.productId && s.quantity >= 1);
        }

        reset({
          type: activity.type,
          subject: activity.subject,
          description: activity.description || "",
          duration: activity.duration ?? undefined,
          outcome: activity.outcome || "",

          prospectId: activity.prospectId,
          scheduledAt: activity.scheduledAt
            ? dayjs(activity.scheduledAt).toISOString()
            : undefined,
          samplesProvided: initialSamples,
          orderDiscussed: activity.orderDiscussed || false,
          orderAmount: activity.orderAmount ?? undefined,

          nextActionType: activity.nextActionType || null,
          nextActionDetails: activity.nextActionDetails || "",
          nextActionDate: activity.nextActionDate
            ? dayjs(activity.nextActionDate).toISOString()
            : null,
        });
        setProductToAdd("");
      }
    }
  }, [open, activity, reset, fetchProspects]);

  const handleAddSampleProduct = () => {
    if (productToAdd) {
      const isAlreadyAdded = fields.some(
        (field) => field.productId === productToAdd
      );
      if (isAlreadyAdded) {
        toast.warning("Product already added to samples list.");
        return;
      }
      append({ productId: productToAdd, quantity: 1 });
      setProductToAdd("");
    } else {
      toast.info("Please select a product to add.");
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        duration: data.duration ?? null,
        orderAmount: data.orderAmount ?? null,
        scheduledAt: data.scheduledAt
          ? dayjs(data.scheduledAt).toISOString()
          : null,

        nextActionType: data.nextActionType || null,
        nextActionDetails: data.nextActionDetails || null,
        nextActionDate: data.nextActionDate
          ? dayjs(data.nextActionDate).toISOString()
          : null,
      };

      const response = await fetch(`/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to update activity" }));
        throw new Error(errorData.message || "Failed to update activity");
      }

      toast.success("Activity updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        {}
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Update activity information, pharmaceutical details, and next
            actions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CALL">Call</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="VISIT">Visit</SelectItem>
                        <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                        <SelectItem value="PRESENTATION">
                          Presentation
                        </SelectItem>
                        <SelectItem value="SAMPLE_DROP">Sample Drop</SelectItem>
                        <SelectItem value="ORDER_COLLECTION">
                          Order Collection
                        </SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="prospectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prospect *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!prospects.length || loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select prospect" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {prospects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {p.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Follow-up discussion"
                      {...field}
                    />
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
                      placeholder="Detailed notes..."
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Activity Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full md:w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              dayjs(field.value).format("MMM D, YYYY")
                            ) : (
                              <span>Pick a date</span>
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
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., Confirmed interest, objection handled"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="border-t pt-6 space-y-4">
              <h4 className="text-lg font-semibold">Next Action & Reminder</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <Label className="w-full text-sm font-medium mb-1">
                  Quick Set Next Action:
                </Label>
                {quickNextActions.map((action) => (
                  <Button
                    key={action.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue("nextActionType", action.type as any);
                      setValue("nextActionDetails", action.details);
                      setValue(
                        "nextActionDate",
                        dayjs()
                          .add(action.daysOffset, "day")
                          .hour(9)
                          .minute(0)
                          .second(0)
                          .toISOString()
                      );
                      trigger([
                        "nextActionType",
                        "nextActionDetails",
                        "nextActionDate",
                      ]);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FormField
                  control={control}
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
                  control={control}
                  name="nextActionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Next Action Due Date
                        {(watch("nextActionType") ||
                          watch("nextActionDetails")) && (
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
                name="nextActionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Details
                      {watch("nextActionType") === "CUSTOM_TASK" && (
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
                    <FormDescription>
                      {watch("nextActionType") === "WHATSAPP_SELF"
                        ? "This will schedule a WhatsApp reminder to your registered number"
                        : "Notes for the next action."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="border-t pt-6 space-y-4">
              <h4 className="text-lg font-semibold">Pharmaceutical Details</h4>
              <div>
                <Label className="mb-1 block font-medium">
                  Samples Provided
                </Label>
                <div className="flex items-start gap-2 mb-3">
                  <div className="flex-grow">
                    <Select
                      value={productToAdd}
                      onValueChange={setProductToAdd}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {productOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={fields.some(
                              (fieldEntry) =>
                                fieldEntry.productId === option.value
                            )}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSampleProduct}
                    variant="outline"
                  >
                    Add Sample
                  </Button>
                </div>
                <div className="space-y-3">
                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-end gap-3 p-3 border rounded-md shadow-sm bg-slate-50"
                    >
                      <FormField
                        control={control}
                        name={`samplesProvided.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormLabel>Product</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly
                                className="bg-gray-100 cursor-default"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`samplesProvided.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-28 flex-shrink-0">
                            <FormLabel>Strips</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Qty"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        aria-label="Remove sample"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                {errors.samplesProvided &&
                  !Array.isArray(errors.samplesProvided) && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      {errors.samplesProvided.message}
                    </p>
                  )}
                {Array.isArray(errors.samplesProvided) &&
                  errors.samplesProvided.length > 0 &&
                  errors.samplesProvided.some((e) => e) && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      Please correct errors in samples provided.
                    </p>
                  )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                <FormField
                  control={control}
                  name="orderDiscussed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2 h-10">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="orderDiscussedEdit"
                        />
                      </FormControl>
                      <Label
                        htmlFor="orderDiscussedEdit"
                        className="font-normal cursor-pointer"
                      >
                        Order Discussed
                      </Label>
                    </FormItem>
                  )}
                />
                {watch("orderDiscussed") && (
                  <FormField
                    control={control}
                    name="orderAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="orderAmountEdit">
                          Order Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="orderAmountEdit"
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            <DialogFooter className="pt-4 flex flex-row gap-2 justify-end">
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
