import { Label } from "~/components/ui/label";
import { UploadDropzone } from "~/lib/uploadthing";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  getError: (fieldName: string) => string | null;
}

const renderDropzone = (onChange: (url: string) => void) => (
  <UploadDropzone
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
    content={{ allowedContent: "Image (4MB)" }}
    className="w-full rounded-lg border-2 border-dashed p-2"
  />
);

const renderPreview = (value: string, onChange: (url: string) => void) => (
  <div className="relative w-full rounded-md border border-gray-300 bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-800">
    <img
      src={value}
      alt="Uploaded Base Image"
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

export default function BaseImageUploader({
  value,
  onChange,
  getError,
}: ImageUploaderProps) {
  return (
    <div>
      <Label htmlFor="baseImage">Base Fabric Image</Label>
      {value ? renderPreview(value, onChange) : renderDropzone(onChange)}
      {getError("baseImage") && (
        <p className="mt-1 text-sm text-red-500">{getError("baseImage")}</p>
      )}
    </div>
  );
}
