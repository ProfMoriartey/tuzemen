import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const authenticateUser = async (): Promise<{ userId: string }> => {
  const { userId } = await auth();

  if (!userId) {
    console.error("Uploadthing Unauthorized attempt.");
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new UploadThingError("Unauthorized");
  }
  return { userId };
};

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 40 },
  })
    .middleware(async () => {
      const { userId } = await authenticateUser();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedFileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
