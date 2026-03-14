"use client";

import { useEffect } from "react";
import { useForm } from "@/hooks/use-form";
import { useFetch } from "@/hooks/use-fetch";
import { api } from "@/lib/api-client";
import { endpoints } from "@/lib/api-endpoints";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { compose, minLength, maxLength } from "@/lib/validators";
import type { Workspace } from "@/types/workspace";

export function WorkspaceForm() {
  const { toast } = useToast();
  const { data: workspace, refetch } = useFetch<Workspace>(
    endpoints.workspace.get,
  );

  const form = useForm({
    initialValues: {
      name: "",
    },
    validators: {
      name: compose(
        minLength("Workspace name", 2),
        maxLength("Workspace name", 100),
      ),
    },
    onSubmit: async (values) => {
      await api.patch(endpoints.workspace.update, { name: values.name });
      toast("Workspace updated", "success");
      refetch();
    },
  });

  useEffect(() => {
    if (workspace?.name) {
      form.setValue("name", workspace.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.name]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Workspace</h2>
      </CardHeader>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Workspace Name"
            value={form.values.name}
            onChange={(e) => form.setValue("name", e.target.value)}
            onBlur={() => form.handleBlur("name")}
            error={form.errors.name}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" isLoading={form.isSubmitting}>
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
