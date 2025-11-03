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
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { UploadButton } from "~/lib/uploadthing";
// Define Props for the component
interface EditFabricFormProps {
  fabricId: number;
  onSuccess: () => void;
}

// Extended Variant Type to include the optional ID for existing variants
type VariantState = VariantFormInput & { id?: number };

// Initial state for one new fabric variant
const initialVariant: VariantState = {
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

// --- Custom Hook for Edit Logic ---

const useEditFormState = (fabricId: number, onSuccess: () => void) => {
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [variantInputs, setVariantInputs] = useState<VariantState[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [fabricData, setFabricData] = useState(defaultFabricData);

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
        const data = await getFabricForEdit(fabricId);
        if (data) {
          const { variants, ...mainData } = data;

          const initialVariants: VariantState[] = variants.map((v) => ({
            id: v.id, // KEEP the DB ID for existing variants
            variantCode: v.variantCode,
            variantName: v.variantName,
            variantImage: v.variantImage,
            stockQuantity: v.stockQuantity,
            hexColorCode: v.hexColorCode ?? "",
          }));

          setFabricData(mainData);
          setVariantInputs(
            initialVariants.length > 0 ? initialVariants : [initialVariant],
          );
        }
      } catch (error) {
        console.error("Failed to load fabric data:", error);
        setStatusMessage({
          type: "error",
          text: "Failed to load existing fabric data.",
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
    } else {
      setMainField(fieldId, value);
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setMainField(id as keyof typeof defaultFabricData, checked);
  };

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
      const result = await updateFabric(fabricId, validation.data);

      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
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
    isLoading,
    setMainField, // Exported for use with Uploadthing
    handleMainChange,
    handleCheckboxChange,
    addVariant,
    removeVariant,
    handleVariantChange,
    handleSubmit,
  };
};

// --- Main Edit Form Component ---

export default function EditFabricForm({
  fabricId,
  onSuccess,
}: EditFabricFormProps) {
  const {
    fabricData,
    variantInputs,
    formErrors,
    statusMessage,
    isPending,
    isLoading,
    setMainField,
    handleMainChange,
    handleCheckboxChange,
    addVariant,
    removeVariant,
    handleVariantChange,
    handleSubmit,
  } = useEditFormState(fabricId, onSuccess);

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
    { id: "hasLeadband", label: "Has Leadband" },
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
            onClick={() => onChange("")} // Clear the field state on remove
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- CORE DATA SECTION --- */}
        <h2 className="border-b pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Core Details (ID: {fabricId})
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
                checked={
                  fabricData[id as keyof typeof defaultFabricData] as boolean
                }
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
              key={variant.id ?? `new-${index}`}
              className="relative border-l-4 border-blue-500 bg-gray-50 p-4 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <CardTitle className="text-md">
                  Variant #{index + 1}
                  <Badge variant="outline" className="ml-2">
                    {variant.id ? `Existing (ID: ${variant.id})` : "NEW"}
                  </Badge>
                </CardTitle>
                {variantInputs.length > 0 && (
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
                  value={variant.hexColorCode ?? ""}
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
          disabled={isPending ?? isLoading}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Updating Fabric...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  );
}
