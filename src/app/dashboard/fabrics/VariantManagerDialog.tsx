"use client";

import React, { useState, useEffect, useTransition } from "react";
import { getFabricForEdit, updateFabric } from "../../actions/actions";
import type { FabricFormInput, VariantFormInput } from "../../../lib/types";
import { Loader2, Plus, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { UploadButton, UploadDropzone } from "~/lib/uploadthing"; // For variant image uploads

// Extended Variant Type to include the optional ID for existing variants
type VariantState = VariantFormInput & { id?: number };

interface VariantManagerDialogProps {
  fabricId: number;
  fabricName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const initialVariant: VariantState = {
  variantCode: "",
  variantName: "",
  variantImage: "",
  stockQuantity: 0,
  hexColorCode: "",
};

export default function VariantManagerDialog({
  fabricId,
  fabricName,
  onClose,
  onSuccess,
}: VariantManagerDialogProps) {
  const [variantInputs, setVariantInputs] = useState<VariantState[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // --- Data Loading ---
  useEffect(() => {
    const loadVariants = async () => {
      setIsLoading(true);
      try {
        const data = await getFabricForEdit(fabricId);
        if (data) {
          const initialVariants: VariantState[] = data.variants.map((v) => ({
            id: v.id,
            variantCode: v.variantCode,
            variantName: v.variantName,
            variantImage: v.variantImage,
            stockQuantity: v.stockQuantity,
            hexColorCode: v.hexColorCode ?? "",
          }));

          setVariantInputs(initialVariants);
        }
      } catch (error) {
        setStatusMessage({ type: "error", text: "Failed to load variants." });
      } finally {
        setIsLoading(false);
      }
    };
    void loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricId]);

  // --- Handlers ---

  const addVariant = () =>
    setVariantInputs((prev) => [...prev, initialVariant]);
  const removeVariant = (index: number) =>
    setVariantInputs((prev) => prev.filter((_, i) => i !== index));

  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    let finalValue: string | number;

    if (field === "stockQuantity") {
      finalValue = value === "" ? 0 : Number(value);
    } else {
      finalValue = value;
    }

    setVariantInputs((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: finalValue } : variant,
      ),
    );
  };

  const handleVariantImageUpload = (index: number, url: string) => {
    // Treat the URL update as a variant change
    handleVariantChange(index, "variantImage", url);
  };

  // --- Submission ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    // Combine current fabric data (mocked/minimal) with the full variant list
    // NOTE: This assumes you pass the *current* main fabric data if any of its fields are needed for Zod validation.
    // Since we only care about variants here, we'll pass minimal placeholder data for the main fabric's required fields.
    const minimalFabricData = {
      externalId: "",
      name: fabricName,
      composition: "",
      baseImage: "",
      widthCm: 100,
      weightGsm: 100,
      // Include boolean defaults to pass Zod validation
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

    const formData: FabricFormInput = {
      ...minimalFabricData,
      variants: variantInputs,
    };

    startTransition(async () => {
      const result = await updateFabric(fabricId, formData);

      if (result.success) {
        onSuccess();
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  };

  // --- Render Helpers ---

  const renderImageField = (value: string, onChange: (url: string) => void) => {
    // ... (Image preview/UploadDropzone logic from previous step, using UploadDropzone directly) ...
    if (value) {
      return (
        <div className="relative w-full rounded-md border border-gray-300 bg-gray-100 p-2 dark:bg-gray-800">
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CardHeader>
        <CardTitle className="text-xl">
          Manage Variants for "{fabricName}"
        </CardTitle>
        <p className="text-sm text-gray-500">
          Add, edit, or remove colors and patterns.
        </p>
        {statusMessage.text && (
          <Badge
            variant={
              statusMessage.type === "success" ? "default" : "destructive"
            }
          >
            {statusMessage.text}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {variantInputs.map((variant, index) => (
          <Card
            key={variant.id ?? `new-${index}`}
            className="relative border-l-4 border-blue-500 bg-gray-50 p-4 dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <CardTitle className="text-md">
                Variant #{index + 1}
                <Badge variant="outline" className="ml-2">
                  {variant.id ? `ID: ${variant.id}` : "NEW"}
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeVariant(index)}
                className="h-7 w-7 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {/* Code */}
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

              {/* Name */}
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

              {/* Image Upload */}
              <div className="md:col-span-2">
                <Label htmlFor={`v_image_${index}`}>Image</Label>
                {renderImageField(variant.variantImage, (url) =>
                  handleVariantImageUpload(index, url),
                )}
              </div>

              {/* Stock */}
              <div className="md:col-span-1">
                <Label htmlFor={`v_stock_${index}`}>Stock</Label>
                <Input
                  id={`v_stock_${index}`}
                  type="number"
                  value={variant.stockQuantity}
                  onChange={(e) =>
                    handleVariantChange(index, "stockQuantity", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Hex Color */}
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
          className="w-full border-2 border-dashed py-4 text-gray-500 hover:text-gray-800 dark:border-gray-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Variant
        </Button>
      </CardContent>

      <div className="flex justify-end space-x-2 p-4 pt-0">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isLoading}>
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            "Save Variants"
          )}
        </Button>
      </div>
    </form>
  );
}
