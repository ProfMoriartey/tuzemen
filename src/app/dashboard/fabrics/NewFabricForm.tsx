"use client";

import React, { useState, useTransition } from "react";
// Imports are now allowed because the file extension is .tsx
import { createFabric } from "../../actions/actions";
import { fabricSchema, type FabricFormInput } from "../../../lib/types";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";
import { UploadDropzone, UploadButton } from "~/lib/uploadthing";

// Define Props for the component
interface NewFabricFormProps {
  onSuccess: () => void;
}

// Initial state for one fabric variant
const initialVariant = {
  variantCode: "",
  variantName: "",
  variantImage: "",
  stockQuantity: 0,
  hexColorCode: "",
};

// Default fabric data reset state (used for type inference and reset)
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

// --- Custom Hook ---

const useFormState = (onSuccess: () => void) => {
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [variantInputs, setVariantInputs] = useState([
    initialVariant,
  ] as FabricFormInput["variants"]);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [fabricData, setFabricData] = useState(defaultFabricData);

  // Unified setter for any field, used by both input events and Uploadthing
  const setMainField = (
    id: keyof typeof defaultFabricData,
    value: string | number | boolean,
  ) => {
    setFabricData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handles standard HTML input change events (text, number)
  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    const fieldId = id as keyof typeof defaultFabricData;

    if (type === "checkbox") {
      setMainField(fieldId, checked);
    } else {
      setMainField(fieldId, value);
    }
  };

  // Handles boolean (checkbox) fields from Shadcn/UI
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setMainField(id as keyof typeof defaultFabricData, checked);
  };

  // Variant array management
  const addVariant = () =>
    setVariantInputs((prev) => [...prev, initialVariant]);
  const removeVariant = (index: number) =>
    setVariantInputs((prev) => prev.filter((_, i) => i !== index));

  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setVariantInputs((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  // Main submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setStatusMessage({ type: "", text: "" });

    const rawData = {
      ...fabricData,
      variants: variantInputs,
      widthCm: Number(fabricData.widthCm),
      weightGsm: Number(fabricData.weightGsm),
    } as FabricFormInput;

    const validation = fabricSchema.safeParse(rawData);

    if (!validation.success) {
      const errors = validation.error.flatten();
      setFormErrors(errors.fieldErrors as Record<string, string[]>);
      setStatusMessage({
        type: "error",
        text: "Please correct the highlighted errors.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createFabric(validation.data);

      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
        setFabricData(defaultFabricData);
        setVariantInputs([initialVariant]);
        onSuccess();
      } else {
        setStatusMessage({ type: "error", text: result.message });
        if (result.errors) {
          setFormErrors(result.errors as Record<string, string[]>);
        }
      }
    });
  };

  return {
    fabricData,
    variantInputs,
    formErrors,
    statusMessage,
    isPending,
    setMainField,
    handleMainChange,
    handleCheckboxChange,
    addVariant,
    removeVariant,
    handleVariantChange,
    handleSubmit,
  };
};

// --- Main Form Component ---

export default function NewFabricForm({ onSuccess }: NewFabricFormProps) {
  const {
    fabricData,
    variantInputs,
    formErrors,
    statusMessage,
    isPending,
    setMainField,
    handleMainChange,
    handleCheckboxChange,
    addVariant,
    removeVariant,
    handleVariantChange,
    handleSubmit,
  } = useFormState(onSuccess);

  const getError = (fieldName: string) => {
    if (formErrors[fieldName] && formErrors[fieldName].length > 0) {
      return formErrors[fieldName].join(", ");
    }
    return null;
  };

  const booleanFields = [
    { id: "isNormal", label: "Normal Wash" },
    { id: "isSensitiveClean", label: "Sensitive Clean" },
    { id: "isDryClean", label: "Dry Clean" },
    { id: "isSemiTransparant", label: "Semi-Transparent" },
    { id: "isTransparent", label: "Transparent" },
    { id: "isDrapery", label: "Drapery" },
    { id: "isBlackout", label: "Blackout" },
    { id: "hasLeadband", label: "Leadband" },
    { id: "isPlainKnit", label: "Plain Knit" },
    { id: "isJacquardKnit", label: "Jacquard Knit" },
    { id: "isPlainTulle", label: "Plain Tulle" },
    { id: "isJacquardTulle", label: "Jacquard Tulle" },
    { id: "isPlainBase", label: "Plain Base" },
    { id: "isJacquardBase", label: "Jacquard Base" },
    { id: "isKnit", label: "General Knit" },
  ];

  // Helper function to render image preview or the dropzone
  const renderImageField = (value: string, onChange: (url: string) => void) => {
    if (value) {
      return (
        <div className="relative w-full rounded-md border border-gray-300 bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-800">
          <img
            src={value}
            alt="Uploaded Image"
            className="h-auto max-h-32 w-full rounded-md object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          const firstFile = res?.[0];
          if (firstFile) {
            onChange(firstFile.url);
            console.log("Image uploaded successfully:", firstFile.url);
          }
        }}
        onUploadError={(error: Error) => {
          alert(`Upload Error: ${error.message}`);
        }}
        content={{
          allowedContent: "Image (4MB)",
        }}
        className="w-full rounded-lg border-2 border-dashed p-2"
      />
    );
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- CORE DATA SECTION --- */}
        <h2 className="border-b pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Core Details
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="externalId">Product Code (External ID)</Label>
            <Input
              id="externalId"
              value={fabricData.externalId}
              onChange={handleMainChange}
              placeholder="e.g., TZM0151"
            />
            {getError("externalId") && (
              <p className="mt-1 text-sm text-red-500">
                {getError("externalId")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Fabric Name</Label>
            <Input
              id="name"
              value={fabricData.name}
              onChange={handleMainChange}
              placeholder="e.g., Accent"
            />
            {getError("name") && (
              <p className="mt-1 text-sm text-red-500">{getError("name")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="composition">Composition</Label>
            <Input
              id="composition"
              value={fabricData.composition}
              onChange={handleMainChange}
              placeholder="e.g., %100 PES"
            />
          </div>

          <div>
            <Label htmlFor="widthCm">Width (cm)</Label>
            <Input
              id="widthCm"
              type="number"
              value={fabricData.widthCm}
              onChange={handleMainChange}
            />
          </div>

          <div>
            <Label htmlFor="weightGsm">Weight (GSM)</Label>
            <Input
              id="weightGsm"
              type="number"
              value={fabricData.weightGsm}
              onChange={handleMainChange}
            />
          </div>
        </div>

        {/* --- BASE IMAGE UPLOAD --- */}
        <div>
          <Label htmlFor="baseImage">Base Fabric Image</Label>
          {renderImageField(
            fabricData.baseImage,
            (url) => setMainField("baseImage", url), // Direct call to setMainField
          )}
          {getError("baseImage") && (
            <p className="mt-1 text-sm text-red-500">{getError("baseImage")}</p>
          )}
        </div>

        {/* --- BOOLEAN FLAGS SECTION --- */}
        <h2 className="border-b pt-3 pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Attributes & Type
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {booleanFields.map(({ id, label }) => (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={fabricData[id as keyof typeof fabricData] as boolean}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(id, !!checked)
                }
              />
              <Label
                htmlFor={id}
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>

        {/* --- VARIANTS SECTION --- */}
        <h2 className="border-b pt-3 pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Variants ({variantInputs.length})
        </h2>

        {formErrors.variants && formErrors.variants.length > 0 && (
          <p className="mt-1 text-sm font-bold text-red-500">
            {formErrors.variants.join(", ")}
          </p>
        )}

        <div className="space-y-4">
          {variantInputs.map((variant, index) => (
            <Card
              key={variant.id || `new-${index}`}
              className="relative bg-gray-50 p-4 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <CardTitle className="text-md">Variant #{index + 1}</CardTitle>
                {variantInputs.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeVariant(index)}
                    className="h-7 w-7 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="md:col-span-1">
                  <Label htmlFor={`v_code_${index}`}>Code</Label>
                  <Input
                    id={`v_code_${index}`}
                    value={variant.variantCode}
                    onChange={(e) =>
                      handleVariantChange(index, "variantCode", e.target.value)
                    }
                    placeholder="V-01"
                  />
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor={`v_name_${index}`}>Name</Label>
                  <Input
                    id={`v_name_${index}`}
                    value={variant.variantName}
                    onChange={(e) =>
                      handleVariantChange(index, "variantName", e.target.value)
                    }
                    placeholder="Ivory"
                  />
                </div>

                {/* --- VARIANT IMAGE UPLOAD (Using new helper) --- */}
                <div className="md:col-span-2">
                  <Label htmlFor={`v_image_${index}`}>Variant Image</Label>
                  {renderImageField(
                    variant.variantImage,
                    (url) => handleVariantChange(index, "variantImage", url), // Direct URL update
                  )}
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor={`v_stock_${index}`}>Stock</Label>
                  <Input
                    id={`v_stock_${index}`}
                    type="number"
                    value={variant.stockQuantity}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "stockQuantity",
                        Number(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="mt-2">
                <Label htmlFor={`v_hex_${index}`}>Hex Color (Optional)</Label>
                <Input
                  id={`v_hex_${index}`}
                  value={variant.hexColorCode || ""}
                  onChange={(e) =>
                    handleVariantChange(index, "hexColorCode", e.target.value)
                  }
                  placeholder="#FFFFFF"
                />
              </div>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
            className="w-full border-2 border-dashed py-4 text-gray-500 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Variant
          </Button>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <Button
          type="submit"
          className="h-10 w-full text-lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Fabric...
            </>
          ) : (
            "Save Fabric Design"
          )}
        </Button>
      </form>
    </div>
  );
}
