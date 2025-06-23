"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { products as productOptions } from "@/constant/products";
import {
  ProspectType,
  Priority,
  ProspectStatus,
  DoctorType,
  PrescriptionVolume,
  OrderOpportunity,
} from "@prisma/client";
import { PhoneInput } from "../ui/phone-input";

const productQuantityItemSchema = z.object({
  productId: z.string().min(1, "Product selection is required."),
  quantity: z.preprocess(
    (val) =>
      val === "" || val === undefined ? undefined : parseInt(String(val), 10),
    z
      .number({ invalid_type_error: "Quantity must be a number." })
      .min(1, "Quantity must be at least 1 unit/strip.")
  ),
});

const prospectFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." }),
  company: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ProspectStatus).default(ProspectStatus.LEAD),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  source: z.string().optional(),
  notes: z.string().optional(),

  prospectType: z.nativeEnum(ProspectType).optional().nullable(),

  orderOpportunity: z
    .nativeEnum(OrderOpportunity)
    .default(OrderOpportunity.NONE)
    .optional(),
  orderValue: z.preprocess(
    (val) =>
      val === "" || val === undefined ? undefined : parseFloat(String(val)),
    z
      .number({ invalid_type_error: "Order value must be a number." })
      .positive("Order value must be positive.")
      .optional()
      .nullable()
  ),
  doctorType: z.nativeEnum(DoctorType).optional().nullable(),
  specialization: z.string().optional(),
  prescriptionVolume: z
    .nativeEnum(PrescriptionVolume)
    .default(PrescriptionVolume.LOW)
    .optional(),
});

export type ProspectFormData = z.infer<typeof prospectFormSchema>;

interface CreateProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDataForCreate?: ProspectFormData;
}

export function CreateProspectDialog({
  open,
  onOpenChange,
  initialDataForCreate,
}: CreateProspectDialogProps) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectFormSchema),
    defaultValues:
      initialDataForCreate ||
      ({
        name: "",
        phone: "",
        address: "",

        orderOpportunity: OrderOpportunity.NONE,
        orderValue: undefined,
        doctorType: DoctorType.CLINIC_DOCTOR,
        specialization: "",
        prescriptionVolume: PrescriptionVolume.LOW,
      } as ProspectFormData),
  });

  const { control, handleSubmit, watch, reset, setValue } = form;

  const doctorType = watch("doctorType");

  const onSubmit = async (data: ProspectFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        orderValue: data.orderValue ?? null,
      };

      const response = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to create prospect" }));
        throw new Error(errorData.message || "Failed to create prospect");
      }

      toast.success("Prospect created successfully");
      router.refresh();
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to create prospect");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
          <DialogDescription>
            Enter the details for the new prospect. Fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Whatsapp Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry="IN"
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="prospectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Prospect Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select prospect type"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select prospect type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProspectType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace("_", " ")}
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
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-semibold border-b pb-2">
                CRM Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select status"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProspectStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace("_", " ")}
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select priority"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
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
              </div>
              <FormField
                control={control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Website, Referral" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-semibold border-b pb-2">
                Pharmaceutical Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="doctorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Doctor/Individual Type{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select order opportunity"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(DoctorType).map((dt) => (
                            <SelectItem key={dt} value={dt}>
                              {dt.replace("_", " ")}
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
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {doctorType === DoctorType.OTHER
                          ? "Specify Details (if applicable)"
                          : "Specialization"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            doctorType === DoctorType.OTHER
                              ? ""
                              : "e.g., Cardiology"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="prescriptionVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prescription Volume</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select prescription volume"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select prescription volume" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(PrescriptionVolume).map((pv) => (
                            <SelectItem key={pv} value={pv}>
                              {pv.replace("_", " ")}
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
                  name="orderOpportunity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Opportunity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "Select order opportunity"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order opportunity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrderOpportunity).map((oo) => (
                            <SelectItem key={oo} value={oo}>
                              {oo}
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
                name="orderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potential Order Value (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
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
            </div>

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
