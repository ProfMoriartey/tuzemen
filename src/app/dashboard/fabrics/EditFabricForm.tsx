"use client";

import React, { useState, useTransition, useEffect } from "react";
import { updateFabric, getFabricForEdit } from "../../actions/actions";
import {
  fabricSchema,
  type FabricFormInput,
  type VariantFormInput,
} from "../../../lib/types";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { UploadButton } from "~/lib/uploadthing";
import AttributesSection from "./AttributesSection";
import BaseImageUploader from "./BaseImageUploader";
import CoreDetailsSection from "./CoreDetailsSection";

interface EditFabricFormProps {
  fabricId: number;
  onSuccess: () => void;
  onManageVariants: (fabricId: number, fabricName: string) => void; // Prop to open the Variant Manager
}

// Extended Variant Type to include the optional ID for existing variants
type VariantState = VariantFormInput & { id?: number };

// Default fabric data reset state
const defaultFabricData = {
  externalId: "",
  name: "",
  baseImage: "",
  composition: "",
  widthCm: 0,
  weightGsm: 0,
  isNormal: false,
  isSensitiveClean: false,
  isDryClean: false,
  isSemiTransparant: false,
  isTransparent: false,
  isDrapery: false,
  isBlackout: false,
  hasLeadband: false,
  isPlainKnit: false,
  isJacquardKnit: false,
  isPlainTulle: false,
  isJacquardTulle: false,
  isPlainBase: false,
  isJacquardBase: false,
  isKnit: false,
};

// --- Custom Hook for Edit Logic ---

const useEditFormState = (fabricId: number) => {
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [variantInputs, setVariantInputs] = useState<VariantState[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [fabricData, setFabricData] = useState(defaultFabricData);
  const [initialVariantCount, setInitialVariantCount] = useState(0); // Track existing variants

  // Unified setter for main fabric fields (used by inputs and Uploadthing)
  const setMainField = (
    id: keyof typeof defaultFabricData,
    value: string | number | boolean,
  ) => {
    setFabricData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Load existing data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch data for the main form only
        const data = await getFabricForEdit(fabricId);
        if (data) {
          // Destructure variants out and only keep the main data
          const { variants, ...mainData } = data;
          setFabricData(mainData);
          setInitialVariantCount(variants.length); // Save variant count
        }
      } catch (error) {
        console.error("Failed to load fabric data:", error);
        setStatusMessage({
          type: "error",
          text: "Failed to load core fabric data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricId]);

  // Handlers
  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    const fieldId = id as keyof typeof defaultFabricData;

    if (type === "checkbox") {
      setMainField(fieldId, checked);
    } else if (id === "widthCm" || id === "weightGsm") {
      // FIX: For numerical fields, convert the value to a number.
      // If the string is empty, it becomes 0, satisfying state requirements.
      setMainField(fieldId, Number(value));
    } else {
      setMainField(fieldId, value);
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setMainField(id as keyof typeof defaultFabricData, checked);
  };

  // Main submission handler
  const handleSubmit = (onSuccess: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setStatusMessage({ type: "", text: "" });

    const dataToSubmit = {
      ...fabricData,
      widthCm: Number(fabricData.widthCm),
      weightGsm: Number(fabricData.weightGsm),
    }; // No local validation now.

    // --- SERVER ACTION ---
    startTransition(async () => {
      // We cast the core data to the full type to satisfy the function signature.
      const result = await updateFabric(
        fabricId,
        dataToSubmit as FabricFormInput,
      );
      // We don't perform Zod validation here anymore, letting the server handle the authoritative validation against coreFabricSchema.

      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
        onSuccess();
      } else {
        setStatusMessage({ type: "error", text: result.message });
        // Error handling for main fabric fields if necessary
      }
    });
  };

  return {
    fabricData,
    formErrors,
    statusMessage,
    isPending,
    isLoading,
    initialVariantCount,
    setMainField,
    handleMainChange,
    handleCheckboxChange,
    handleSubmit,
  };
};

export default function EditFabricForm({
  fabricId,
  onSuccess,
  onManageVariants,
}: EditFabricFormProps) {
  const {
    fabricData,
    formErrors,
    statusMessage,
    isPending,
    isLoading,
    initialVariantCount,
    setMainField, // Use this for Uploadthing
    handleMainChange, // Use this for standard inputs
    handleCheckboxChange,
    handleSubmit,
  } = useEditFormState(fabricId);

  // Helper to retrieve errors (needs to remain here as it relies on formErrors state)
  const getError = (fieldName: string) => {
    if (formErrors[fieldName] && formErrors[fieldName].length > 0) {
      return formErrors[fieldName].join(", ");
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-3 text-lg text-gray-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div>
      {statusMessage.text && (
        <div
          className={cn(
            "mb-4 rounded-lg p-3 font-medium",
            statusMessage.type === "success"
              ? "border border-green-300 bg-green-100 text-green-700"
              : "border border-red-300 bg-red-100 text-red-700",
          )}
          role="alert"
        >
          {statusMessage.text}
        </div>
      )}
      <form onSubmit={handleSubmit(onSuccess)} className="space-y-6">
        {/* --- 1. CORE DETAILS SECTION --- */}
        <CoreDetailsSection
          data={fabricData}
          onChange={handleMainChange}
          getError={getError}
        />

        {/* --- 2. BASE IMAGE UPLOAD SECTION --- */}
        <BaseImageUploader
          value={fabricData.baseImage}
          onChange={(url) => setMainField("baseImage", url)}
          getError={getError}
        />

        {/* --- 3. ATTRIBUTES SECTION --- */}
        <AttributesSection data={fabricData} onChange={handleCheckboxChange} />

        {/* --- 4. VARIANTS MANAGEMENT BUTTON --- */}
        <div className="pt-4">
          <CardTitle className="mb-2 text-lg">Variant Management</CardTitle>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start text-left"
            onClick={() => onManageVariants(fabricId, fabricData.name)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Manage {initialVariantCount} Associated Variants
          </Button>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            className="h-10 text-lg"
            disabled={isPending ?? isLoading}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving Core Changes...
              </>
            ) : (
              "Save Core Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
