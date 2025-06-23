"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Shield, AlertTriangle } from "lucide-react"

export function CreateSystemAdmin() {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/create-system-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create system admin")
      }

      toast({
        title: "Success",
        description: "System administrator created successfully! You can now sign in.",
      })

      // Reset form and hide it
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      setShowForm(false)

      // Optionally refresh the page
      // router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create system admin",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Create System Administrator</CardTitle>
          <CardDescription>Initialize the system by creating the first super administrator account</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action should only be performed during initial system setup. The created account will have full
              system access.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setShowForm(true)} className="w-full" variant="destructive">
            Create System Administrator
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-xl">Create Administrator</CardTitle>
        <CardDescription>Set up the super administrator account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              placeholder="Enter password (min 8 characters)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Confirm password"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="destructive" className="flex-1">
              {loading ? "Creating..." : "Create Administrator"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
