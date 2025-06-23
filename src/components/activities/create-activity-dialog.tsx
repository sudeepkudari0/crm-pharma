"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Prospect } from "@prisma/client";
import { products } from "@/constant/products";
import dayjs from "dayjs";
import { nextActionTypes, quickNextActions } from "@/types";

const sampleItemSchema = z.object({
  productId: z.string().min(1, "Product selection is required."),
  quantity: z.preprocess(
    (val) =>
      val === "" || val === undefined ? undefined : parseInt(String(val), 10),
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
    prospectId: z.string().min(1, {
      message: "Prospect is required",
    }),
    subject: z.string().min(2, {
      message: "Subject must be at least 2 characters.",
    }),
    description: z.string().optional(),
    duration: z.preprocess(
      (val) =>
        val === "" || val === undefined ? undefined : parseInt(String(val), 10),
      z
        .number({ invalid_type_error: "Duration must be a number." })
        .positive("Duration must be positive.")
        .optional()
    ),
    outcome: z.string().optional(),
    nextAction: z.string().optional(),
    scheduledAt: z.string().optional(),
    samplesProvided: z.array(sampleItemSchema).optional(),
    orderDiscussed: z.boolean().optional().default(false),
    orderAmount: z.preprocess(
      (val) =>
        val === "" || val === undefined ? undefined : parseFloat(String(val)),
      z
        .number({ invalid_type_error: "Order amount must be a number." })
        .positive("Order amount must be positive.")
        .optional()
    ),
    nextActionType: z.string().optional().nullable(),
    nextActionDetails: z.string().optional().nullable(),
    nextActionDate: z
      .string()
      .datetime({ offset: true, message: "Next action date is required" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If a nextActionType or nextActionDetails is set, nextActionDate must be set.
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
        "Next action due date is required if a next action is specified.",
      path: ["nextActionDate"], // Path to show error under
    }
  )
  .refine(
    (data) => {
      // If nextActionType is CUSTOM_TASK, details are required
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

export function CreateActivityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [productToAdd, setProductToAdd] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "CALL",
      prospectId: "",
      subject: "",
      description: "",
      duration: undefined,
      outcome: "",
      nextAction: "",
      scheduledAt: new Date().toISOString(),
      samplesProvided: [],
      orderDiscussed: false,
      orderAmount: undefined,
      nextActionType: null,
      nextActionDetails: "",
      nextActionDate: null,
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "samplesProvided",
  });

  useEffect(() => {
    if (open) {
      fetchProspects();
    }
  }, [open]);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/prospects");
      if (!response.ok) throw new Error("Failed to fetch prospects");
      const data = await response.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Could not load prospects.");
    } finally {
      setLoading(false);
    }
  };

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
          ? new Date(data.scheduledAt).toISOString()
          : null,
        nextActionType: data.nextActionType || null,
        nextActionDetails: data.nextActionDetails || null,
        nextActionDate: data.nextActionDate
          ? new Date(data.nextActionDate).toISOString()
          : null,
      };

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to create activity" }));
        throw new Error(errorData.message || "Failed to create activity");
      }

      toast.success("Activity logged successfully");
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to log activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          reset();
          setProductToAdd("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Log a new activity to track your interactions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <FormLabel>
                      Prospect <span className="text-red-500">*</span>
                    </FormLabel>
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
                        {prospects.map((prospect) => (
                          <SelectItem key={prospect.id} value={prospect.id}>
                            {prospect.name} - {prospect.company}
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
                  <FormLabel>
                    Subject <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Initial introduction call"
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
                      placeholder="Detailed notes about the activity..."
                      {...field}
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
                control={control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Sent proposal, scheduled follow-up"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="border-t pt-6 space-y-4">
              <h4 className="text-lg font-semibold">Next Action & Reminder</h4>

              {/* Quick Add Buttons/Badges */}
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
                      form.setValue("nextActionType", action.type as any);
                      form.setValue("nextActionDetails", action.details);
                      form.setValue(
                        "nextActionDate",
                        dayjs()
                          .add(action.daysOffset, "day")
                          .hour(9)
                          .minute(0)
                          .second(0)
                          .toISOString()
                      );
                      form.trigger([
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
                        Next Action Due Date{" "}
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                            } // Allow today and future
                            initialFocus
                          />
                          {/* Basic Time Picker (consider a dedicated time picker component for better UX) */}
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
                        placeholder="Specific details about the next action (e.g., products for samples, specific points to discuss)..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch("nextActionType") === "WHATSAPP_SELF"
                        ? "A WhatsApp reminder will be sent to your registered number one day before the due date."
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
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {products.map((option) => (
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
                  errors.samplesProvided.length > 0 && (
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
                      {" "}
                      {}
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="orderDiscussed"
                        />
                      </FormControl>
                      <Label
                        htmlFor="orderDiscussed"
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
                        <FormLabel htmlFor="orderAmount">
                          Order Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="orderAmount"
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

            <FormField
              control={control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>Activity Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => field.onChange(date?.toISOString())}
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

            <DialogFooter className="pt-4 flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                  setProductToAdd("");
                }}
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
