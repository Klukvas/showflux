"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import { api } from "@/lib/api-client";
import { endpoints } from "@/lib/api-endpoints";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  compose,
  required,
  minLength,
  maxLength,
  positiveNumber,
} from "@/lib/validators";
import type { Listing } from "@/types/listing";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

interface ListingFormProps {
  readonly listing?: Listing;
}

export function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!listing;

  const form = useForm({
    initialValues: {
      address: listing?.address ?? "",
      city: listing?.city ?? "",
      state: listing?.state ?? "",
      zip: listing?.zip ?? "",
      mlsNumber: listing?.mlsNumber ?? "",
      price: listing?.price?.toString() ?? "",
      bedrooms: listing?.bedrooms?.toString() ?? "",
      bathrooms: listing?.bathrooms?.toString() ?? "",
      sqft: listing?.sqft?.toString() ?? "",
      status: listing?.status ?? "active",
      notes: listing?.notes ?? "",
    },
    validators: {
      address: compose(
        required("Address"),
        minLength("Address", 3),
        maxLength("Address", 255),
      ),
      city: compose(
        required("City"),
        minLength("City", 2),
        maxLength("City", 100),
      ),
      state: compose(
        required("State"),
        minLength("State", 2),
        maxLength("State", 2),
      ),
      zip: compose(required("ZIP"), minLength("ZIP", 5), maxLength("ZIP", 10)),
      price: compose(required("Price"), positiveNumber("Price")),
    },
    onSubmit: async (values) => {
      const payload = {
        address: values.address,
        city: values.city,
        state: values.state.toUpperCase(),
        zip: values.zip,
        mlsNumber: values.mlsNumber || undefined,
        price: Number(values.price),
        bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
        bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
        sqft: values.sqft ? Number(values.sqft) : undefined,
        status: values.status as Listing["status"],
        notes: values.notes || undefined,
      };

      if (isEditing) {
        await api.patch(endpoints.listings.update(listing.id), payload);
        toast("Listing updated", "success");
      } else {
        await api.post(endpoints.listings.create, payload);
        toast("Listing created", "success");
      }
      router.push("/listings");
      router.refresh();
    },
  });

  return (
    <Card>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Address"
            value={form.values.address}
            onChange={(e) => form.setValue("address", e.target.value)}
            onBlur={() => form.handleBlur("address")}
            error={form.errors.address}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="City"
              value={form.values.city}
              onChange={(e) => form.setValue("city", e.target.value)}
              onBlur={() => form.handleBlur("city")}
              error={form.errors.city}
            />
            <Input
              label="State"
              maxLength={2}
              placeholder="CA"
              value={form.values.state}
              onChange={(e) => form.setValue("state", e.target.value)}
              onBlur={() => form.handleBlur("state")}
              error={form.errors.state}
            />
            <Input
              label="ZIP"
              value={form.values.zip}
              onChange={(e) => form.setValue("zip", e.target.value)}
              onBlur={() => form.handleBlur("zip")}
              error={form.errors.zip}
            />
            <Input
              label="MLS #"
              value={form.values.mlsNumber}
              onChange={(e) => form.setValue("mlsNumber", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="Price"
              type="number"
              value={form.values.price}
              onChange={(e) => form.setValue("price", e.target.value)}
              onBlur={() => form.handleBlur("price")}
              error={form.errors.price}
            />
            <Input
              label="Bedrooms"
              type="number"
              value={form.values.bedrooms}
              onChange={(e) => form.setValue("bedrooms", e.target.value)}
            />
            <Input
              label="Bathrooms"
              type="number"
              value={form.values.bathrooms}
              onChange={(e) => form.setValue("bathrooms", e.target.value)}
            />
            <Input
              label="Sqft"
              type="number"
              value={form.values.sqft}
              onChange={(e) => form.setValue("sqft", e.target.value)}
            />
          </div>
          <Select
            label="Status"
            options={statusOptions}
            value={form.values.status}
            onChange={(e) => form.setValue("status", e.target.value)}
          />
          <Textarea
            label="Notes"
            value={form.values.notes}
            onChange={(e) => form.setValue("notes", e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={form.isSubmitting}>
            {isEditing ? "Update Listing" : "Create Listing"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
