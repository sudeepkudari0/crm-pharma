"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Globe,
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  PlusCircle,
  Search,
  Filter,
} from "lucide-react";
import {
  DoctorType,
  OrderOpportunity,
  PrescriptionVolume,
  Priority,
  ProspectType as PrismaProspectType,
  ProspectStatus,
} from "@prisma/client"; // For filter options
import { CreateProspectDialog } from "@/components/prospects/create-prospect-dialog";
import type { ProspectFormData } from "@/components/prospects/create-prospect-dialog";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the structure of a discovered prospect
interface DiscoveredProspect {
  id: string; // Temporary client-side ID
  name: string;
  prospectType: PrismaProspectType | string; // Allow string for "OTHER" or if AI isn't perfect
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  sourceUrl: string;
}

// Location options for the filter
const locationOptions = [
  { value: "ALL", label: "All Locations" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Mysore", label: "Mysore" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Delhi", label: "Delhi" },
  // Add more major cities
];

// Prospect type options for the filter (from Prisma enum)
const prospectTypeOptions = [
  { value: "ALL", label: "All Types" },
  ...Object.values(PrismaProspectType).map((type) => ({
    value: type,
    label: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  })),
];

export function ProspectDiscoveryClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [prospectTypeFilter, setProspectTypeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiscoveredProspect[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showCreateProspectDialog, setShowCreateProspectDialog] =
    useState(false);
  const [prospectToCreate, setProspectToCreate] =
    useState<ProspectFormData | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/prospect-discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm,
          prospectTypeFilter,
          locationFilter,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Search failed. Please try again." }));
        throw new Error(
          errorData.error || errorData.message || "Search request failed."
        );
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        toast.success(`Found ${data.results.length} potential prospects.`);
      } else {
        toast.info(data.message || "No new prospects found for your query.");
      }
    } catch (err: any) {
      console.error("Prospect discovery error:", err);
      setError(err.message || "An error occurred during the search.");
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsProspect = (prospect: DiscoveredProspect) => {
    const prospectDataForForm: ProspectFormData = {
      name: prospect.name,
      status: ProspectStatus.LEAD,
      priority: Priority.MEDIUM,
      source: `Web Discovery (${prospect.sourceUrl.substring(0, 30)}...)`, // Add source
      notes: `Found via web discovery from ${prospect.sourceUrl}.\nSpecialization: ${prospect.specialization || "N/A"}`,
      // Default other fields as needed
      phone: prospect.phone || "",
      email: prospect.email || "",
      address: prospect.address || "",
      specialization: prospect.specialization || "",
      orderOpportunity: OrderOpportunity.NONE,
      orderValue: undefined,
      doctorType: DoctorType.CLINIC_DOCTOR,
      prescriptionVolume: PrescriptionVolume.LOW,
    };
    setProspectToCreate(prospectDataForForm);
    setShowCreateProspectDialog(true);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Define Your Search
          </CardTitle>
          <CardDescription>
            Specify keywords, prospect type, and location to find new leads.
            Examples: "oncologists", "pharmacies with home delivery", "dental
            clinics with pediatric services".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="searchTerm"
                className="text-sm font-medium text-foreground"
              >
                Search Keywords *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., Cardiologists, Skincare Clinics, Pharmacies..."
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="prospectTypeFilter"
                  className="text-sm font-medium text-foreground"
                >
                  Prospect Type
                </label>
                <Select
                  value={prospectTypeFilter}
                  onValueChange={setProspectTypeFilter}
                  disabled={isLoading}
                >
                  <SelectTrigger id="prospectTypeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prospectTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="locationFilter"
                  className="text-sm font-medium text-foreground"
                >
                  Location
                </label>
                <Select
                  value={locationFilter}
                  onValueChange={setLocationFilter}
                  disabled={isLoading}
                >
                  <SelectTrigger id="locationFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Discover Prospects
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4 mt-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-28 rounded-md ml-auto" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-center mt-8">{error}</p>}

      {!isLoading && results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Discovered Potentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((prospect) => (
              <Card
                key={prospect.id}
                className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    {prospect.prospectType.includes("DOCTOR") ? (
                      <User className="mr-2 h-5 w-5 text-primary" />
                    ) : (
                      <Building className="mr-2 h-5 w-5 text-primary" />
                    )}
                    {prospect.name}
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {prospect.prospectType.replace("_", " ").toLowerCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {prospect.specialization && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Specialization:
                      </span>{" "}
                      {prospect.specialization}
                    </p>
                  )}
                  {prospect.phone && (
                    <p className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
                      {prospect.phone}
                    </p>
                  )}
                  {prospect.email && (
                    <p
                      className="flex items-center truncate"
                      title={prospect.email}
                    >
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
                      {prospect.email}
                    </p>
                  )}
                  {prospect.address && (
                    <p className="flex items-start">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />{" "}
                      {prospect.address}
                    </p>
                  )}
                  {prospect.website && (
                    <p className="flex items-center truncate">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <a
                        href={
                          prospect.website.startsWith("http")
                            ? prospect.website
                            : `http://${prospect.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {prospect.website}
                      </a>
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={prospect.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary items-center flex"
                        >
                          <LinkIcon className="mr-1 h-3 w-3" /> Source
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs truncate">
                          {prospect.sourceUrl}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    size="sm"
                    onClick={() => handleAddAsProspect(prospect)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add to CRM
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog for creating prospect */}
      {prospectToCreate && showCreateProspectDialog && (
        <CreateProspectDialog
          open={showCreateProspectDialog}
          onOpenChange={setShowCreateProspectDialog}
          // You might need to adjust CreateProspectDialog to accept initialData
          // or have a separate "prefillData" prop.
          // For simplicity, let's assume you modify CreateProspectDialog
          // to take `initialValues` which it uses in its `useForm` `defaultValues`.
          // If CreateProspectDialog uses its own defaultValues, prefilling is harder without refactor.
          // Let's assume it can take initial values.
          // This part requires CreateProspectDialog to be adaptable.
          // A common way is to pass defaultValues to useForm in CreateProspectDialog.
          // If not, you might need a more complex state lift or context.
          initialDataForCreate={prospectToCreate} // This is a hypothetical prop
        />
      )}
    </div>
  );
}
