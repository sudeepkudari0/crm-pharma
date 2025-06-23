"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ProspectWithRelations } from "@/types";
import {
  ProspectType,
  Priority,
  ProspectStatus,
  DoctorType,
  PrescriptionVolume,
  OrderOpportunity,
} from "@prisma/client";
import { PhoneInput } from "../ui/phone-input";

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
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.nativeEnum(ProspectStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  prospectType: z.nativeEnum(ProspectType).optional().nullable(),
  orderOpportunity: z.nativeEnum(OrderOpportunity).optional(),
  orderValue: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null
        ? undefined
        : parseFloat(String(val)),
    z
      .number({ invalid_type_error: "Order value must be a number." })
      .positive()
      .optional()
      .nullable()
  ),
  doctorType: z.nativeEnum(DoctorType).optional().nullable(),
  specialization: z.string().optional().nullable(),
  prescriptionVolume: z.nativeEnum(PrescriptionVolume).optional(),
});

type ProspectFormData = z.infer<typeof prospectFormSchema>;

interface EditProspectDialogProps {
  prospect: ProspectWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProspectDialog({
  prospect,
  open,
  onOpenChange,
}: EditProspectDialogProps) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const form = useForm<ProspectFormData>({
    resolver: zodResolver(prospectFormSchema),
    defaultValues: {
      name: prospect.name || "",
      email: prospect.email || "",
      phone: prospect.phone || "",
      company: prospect.company || null,
      position: prospect.position || null,
      address: prospect.address || null,
      status: prospect.status || undefined,
      priority: prospect.priority || undefined,
      source: prospect.source || null,
      notes: prospect.notes || null,
      prospectType: prospect.prospectType || null,
      orderOpportunity: prospect.orderOpportunity || undefined,
      orderValue: prospect.orderValue || null,
      doctorType: prospect.doctorType || null,
      specialization: prospect.specialization || null,
      prescriptionVolume: prospect.prescriptionVolume || undefined,
    },
  });

  const { control, handleSubmit, watch } = form;

  const doctorType = watch("doctorType");

  const onSubmit = async (data: ProspectFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        orderValue: data.orderValue ?? null,
      };

      const response = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to update prospect" }));
        throw new Error(errorData.message || "Failed to update prospect");
      }
      toast.success("Prospect updated successfully");
      onOpenChange(false);

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update prospect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Edit Prospect</DialogTitle>
          <DialogDescription>
            Update the prospect's information. Fields marked with * are
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
                      <FormLabel>Name *</FormLabel>
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
                      <FormLabel>Phone *</FormLabel>
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
                        <Input
                          type="email"
                          {...field}
                          value={field.value ?? ""}
                        />
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
                        <Input {...field} value={field.value ?? ""} />
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
                      <FormLabel>Prospect Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select prospect type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProspectType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                        <Input {...field} value={field.value ?? ""} />
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        value={field.value ?? ""}
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                        value={field.value}
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
              </div>
              <FormField
                control={control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Website, Referral"
                        {...field}
                        value={field.value ?? ""}
                      />
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
                        value={field.value ?? ""}
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
                      <FormLabel>Doctor Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
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
                          value={field.value ?? ""}
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
