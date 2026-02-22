"use client";

import { useRouter } from "next/navigation";
import { useProperties } from "@/hooks/use-properties";
import { useProperty } from "@/lib/providers/property-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin } from "lucide-react";
import { LoadingPage } from "@/components/loading";
import { PageHeader } from "@/components/page-header";

export default function PropertiesPage() {
  const { data: properties, isLoading } = useProperties();
  const { selectProperty } = useProperty();
  const router = useRouter();

  const handleSelect = (propertyId: number) => {
    selectProperty(propertyId);
    router.push("/dashboard");
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Select Property"
          description="Choose a property to manage"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                  </div>
                  <Badge variant={property.status === "ACTIVE" ? "success" : "secondary"}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  {[property.city, property.country].filter(Boolean).join(", ")}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSelect(property.id)}
                >
                  Go To Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
          {properties?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No properties found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
