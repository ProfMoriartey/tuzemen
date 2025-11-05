import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

// Define the required boolean fields once in the parent form or here
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

interface AttributesProps {
  data: any;
  onChange: (id: string, checked: boolean) => void;
}

export default function AttributesSection({ data, onChange }: AttributesProps) {
  return (
    <>
      <h2 className="border-b pt-3 pb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Attributes & Type
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {booleanFields.map(({ id, label }) => (
          <div key={id} className="flex items-center space-x-2">
            <Checkbox
              id={id}
              // Safely cast the field value to boolean
              checked={data[id as keyof typeof data] as boolean}
              onCheckedChange={(checked) => onChange(id, !!checked)}
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
    </>
  );
}
