import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface CoreDetailsProps {
  data: any; // Use the specific type if available (defaultFabricData)
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getError: (fieldName: string) => string | null;
}

export default function CoreDetailsSection({
  data,
  onChange,
  getError,
}: CoreDetailsProps) {
  return (
    <>
      <h2 className="border-b pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Core Details
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="externalId">Product Code (External ID)</Label>
          <Input
            id="externalId"
            value={data.externalId}
            onChange={onChange}
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
            value={data.name}
            onChange={onChange}
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
            value={data.composition}
            onChange={onChange}
            placeholder="e.g., %100 PES"
          />
        </div>
        <div>
          <Label htmlFor="widthCm">Width (cm)</Label>
          <Input
            id="widthCm"
            type="number"
            value={data.widthCm}
            onChange={onChange}
          />
        </div>
        <div>
          <Label htmlFor="weightGsm">Weight (GSM)</Label>
          <Input
            id="weightGsm"
            type="number"
            value={data.weightGsm}
            onChange={onChange}
          />
        </div>
      </div>
    </>
  );
}
