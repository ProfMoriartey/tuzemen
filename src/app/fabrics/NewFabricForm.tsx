"use client";

import React, { useState, useTransition } from "react";
// Imports are now allowed because the file extension is .tsx
import { createFabric } from "../actions/actions";
import { fabricSchema, type FabricFormInput } from "../../lib/types";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";

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

// --- Custom Hook ---

const useFormState = (onSuccess: () => void) => {
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({}); // Explicitly typed errors
  const [variantInputs, setVariantInputs] = useState([initialVariant] as {
    variantCode: string;
    variantName: string;
    variantImage: string;
    stockQuantity: number;
    hexColorCode: string | undefined;
  }[]);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [fabricData, setFabricData] = useState(defaultFabricData);

  // Handles text, number, and image fields
  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFabricData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  // Handles boolean (checkbox) fields
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFabricData((prev) => ({ ...prev, [id]: checked }));
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

    // 1. Combine data
    const rawData = {
      ...fabricData,
      variants: variantInputs,
      widthCm: Number(fabricData.widthCm),
      weightGsm: Number(fabricData.weightGsm),
    } as FabricFormInput; // Use FabricFormInput type

    // 2. Validate locally
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

    // 3. Call Server Action
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

  // Array of boolean fields for easy rendering
  const booleanFields = [
    // Features
    { id: "isNormal", label: "Normal Wash" },
    { id: "isSensitiveClean", label: "Sensitive Clean" },
    { id: "isDryClean", label: "Dry Clean" },
    { id: "isSemiTransparant", label: "Semi-Transparent" },
    { id: "isTransparent", label: "Transparent" },
    { id: "isDrapery", label: "Drapery" },
    { id: "isBlackout", label: "Blackout" },
    { id: "hasLeadband", label: "Has Leadband" },
    // Weave/Type
    { id: "isPlainKnit", label: "Plain Knit" },
    { id: "isJacquardKnit", label: "Jacquard Knit" },
    { id: "isPlainTulle", label: "Plain Tulle" },
    { id: "isJacquardTulle", label: "Jacquard Tulle" },
    { id: "isPlainBase", label: "Plain Base" },
    { id: "isJacquardBase", label: "Jacquard Base" },
    { id: "isKnit", label: "General Knit" },
  ];

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
              className={cn(getError("externalId") && "border-red-500")}
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
              className={cn(getError("name") && "border-red-500")}
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
              className={cn(getError("composition") && "border-red-500")}
              placeholder="e.g., %100 PES"
            />
            {getError("composition") && (
              <p className="mt-1 text-sm text-red-500">
                {getError("composition")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="widthCm">Width (cm)</Label>
            <Input
              id="widthCm"
              type="number"
              value={fabricData.widthCm}
              onChange={handleMainChange}
              className={cn(getError("widthCm") && "border-red-500")}
            />
            {getError("widthCm") && (
              <p className="mt-1 text-sm text-red-500">{getError("widthCm")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="weightGsm">Weight (GSM)</Label>
            <Input
              id="weightGsm"
              type="number"
              value={fabricData.weightGsm}
              onChange={handleMainChange}
              className={cn(getError("weightGsm") && "border-red-500")}
            />
            {getError("weightGsm") && (
              <p className="mt-1 text-sm text-red-500">
                {getError("weightGsm")}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="baseImage">Base Image URL (Uploadthing Link)</Label>
          <Input
            id="baseImage"
            value={fabricData.baseImage}
            onChange={handleMainChange}
            className={cn(getError("baseImage") && "border-red-500")}
            placeholder="https://utfs.io/f/base_image.jpg"
          />
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
              key={index}
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

                <div className="md:col-span-2">
                  <Label htmlFor={`v_image_${index}`}>Image URL</Label>
                  <Input
                    id={`v_image_${index}`}
                    value={variant.variantImage}
                    onChange={(e) =>
                      handleVariantChange(index, "variantImage", e.target.value)
                    }
                    placeholder="https://utfs.io/f/variant_1.jpg"
                  />
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

              {/* Hex Color Code - optional */}
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
