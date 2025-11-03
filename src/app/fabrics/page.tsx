"use client";

import React, { useState, useEffect } from "react";
import { deleteFabric } from "../actions/actions";
import { fetchFabricData } from "../server-utils";
import NewFabricForm from "./NewFabricForm";
import EditFabricForm from "./EditFabricForm"; // NEW IMPORT
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Trash2, PlusCircle, Loader2, Pencil } from "lucide-react"; // Added Pencil icon

// Define the type for the data structure returned by getFabrics/fetchFabricData
type FabricWithVariants = Awaited<ReturnType<typeof fetchFabricData>>[number];

/**
 * Component to display the list of all fabrics with their details.
 * This is now a Client Component to manage the Dialog state and client data hydration.
 */
export default function FabricListPage() {
  const [fabrics, setFabrics] = useState<FabricWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Create Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // State for Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fabricToEditId, setFabricToEditId] = useState<number | null>(null);

  // Function to load data from the server utility
  const loadFabrics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFabricData();
      setFabrics(data);
    } catch (error) {
      console.error("Failed to fetch fabrics:", error);
      setFabrics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFabrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditDialog = (id: number) => {
    setFabricToEditId(id);
    setEditDialogOpen(true);
  };

  const FabricActionButtons = ({ fabricId }: { fabricId: number }) => {
    // Client-side execution of Server Action
    const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this fabric?")) {
        const result = await deleteFabric(fabricId);
        if (result.success) {
          await loadFabrics();
        } else {
          alert(result.message);
        }
      }
    };

    return (
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-md"
          title="Edit Fabric"
          onClick={() => openEditDialog(fabricId)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 rounded-md"
          title="Delete Fabric"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Define the list of keys and their labels
  const attributeKeys: { key: keyof FabricWithVariants; label: string }[] = [
    { key: "isBlackout", label: "Blackout" },
    { key: "isTransparent", label: "Transparent" },
    { key: "isDrapery", label: "Drapery" },
    { key: "hasLeadband", label: "Leadband" },
    { key: "isDryClean", label: "Dry Clean Only" },
  ];

  const weaveKeys: { key: keyof FabricWithVariants; label: string }[] = [
    { key: "isPlainKnit", label: "Plain Knit" },
    { key: "isJacquardKnit", label: "Jacquard Knit" },
    { key: "isPlainTulle", label: "Plain Tulle" },
    { key: "isJacquardTulle", label: "Jacquard Tulle" },
    { key: "isKnit", label: "General Knit" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="ml-3 text-lg text-gray-600">Loading Fabric Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-12 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            Fabric Catalog
          </h1>

          {/* --- CREATE DIALOG TRIGGER --- */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-6">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Fabric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Add New Fabric Design</DialogTitle>
                <DialogDescription>
                  Enter the master data and all associated variants.
                </DialogDescription>
              </DialogHeader>
              <NewFabricForm
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  void loadFabrics();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* --- EDIT DIALOG --- */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Edit Fabric Design</DialogTitle>
              <DialogDescription>
                Modify the fabric details and its variants.
              </DialogDescription>
            </DialogHeader>
            {fabricToEditId && (
              <EditFabricForm
                fabricId={fabricToEditId}
                onSuccess={() => {
                  setEditDialogOpen(false);
                  void loadFabrics();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {fabrics.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="text-xl font-semibold">No Fabrics Found</h2>
            <p className="mt-2 text-gray-500">
              Start by adding your first fabric design using the button above.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {fabrics.map((fabric) => (
              <Card
                key={fabric.id}
                className="shadow-lg transition-shadow duration-300 hover:shadow-xl"
              >
                <CardHeader className="flex flex-col items-start justify-between border-b pb-4 md:flex-row md:items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {fabric.name} ({fabric.externalId})
                    </CardTitle>
                    <CardDescription className="mt-1 text-base">
                      {fabric.composition} | {fabric.widthCm}cm x{" "}
                      {fabric.weightGsm}gsm
                    </CardDescription>
                  </div>
                  <div className="mt-3 flex space-x-2 md:mt-0">
                    <Badge variant="secondary" className="px-3 py-1">
                      Variants: {fabric.variants.length}
                    </Badge>
                    <FabricActionButtons fabricId={fabric.id} />
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Attributes Column */}
                    <div>
                      <h3 className="mb-2 border-b pb-1 font-semibold text-gray-700 dark:text-gray-300">
                        Key Attributes
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {attributeKeys.map((item) => (
                          <li key={item.key} className="flex justify-between">
                            <span>{item.label}:</span>
                            <span
                              className={
                                fabric[item.key]
                                  ? "font-medium text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {fabric[item.key] ? "Yes" : "No"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weave Column */}
                    <div>
                      <h3 className="mb-2 border-b pb-1 font-semibold text-gray-700 dark:text-gray-300">
                        Weave/Type
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {weaveKeys.map((item) => (
                          <li key={item.key} className="flex justify-between">
                            <span>{item.label}:</span>
                            <span
                              className={
                                fabric[item.key]
                                  ? "font-medium text-blue-500"
                                  : "text-gray-400"
                              }
                            >
                              {fabric[item.key] ? "Yes" : "No"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Variants Table Column */}
                    <div className="overflow-x-auto lg:col-span-1">
                      <h3 className="mb-2 border-b pb-1 font-semibold text-gray-700 dark:text-gray-300">
                        Variants
                      </h3>
                      {fabric.variants.length > 0 ? (
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-gray-700">
                              <TableHead className="w-[100px]">Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">
                                Stock
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fabric.variants.map((variant) => (
                              <TableRow key={variant.id}>
                                <TableCell className="text-xs font-medium">
                                  {variant.variantCode}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {variant.variantName}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {variant.stockQuantity}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No variants recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
