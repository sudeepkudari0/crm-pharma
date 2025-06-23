import * as z from "zod"

export const productSchema = z.object({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  sku: z.string().min(3, {
    message: "SKU must be at least 3 characters.",
  }),
  description: z.string().optional(),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  manufacturer: z.string().min(2, {
    message: "Manufacturer name must be at least 2 characters.",
  }),
  dosage: z.string().optional(),
  formulation: z.string().optional(),
  unitPrice: z.number().min(0.01, {
    message: "Unit price must be greater than 0.",
  }),
  reorderLevel: z.number().min(1, {
    message: "Reorder level must be at least 1.",
  }),
})

export const inventorySchema = z.object({
  productId: z.string().min(1, {
    message: "Please select a product.",
  }),
  batchNumber: z.string().min(1, {
    message: "Batch number is required.",
  }),
  quantity: z.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
  expiryDate: z.date({
    required_error: "Expiry date is required.",
  }),
  locationId: z.string().min(1, {
    message: "Please select a location.",
  }),
})
