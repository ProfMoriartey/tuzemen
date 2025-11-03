import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
// Use the official Clerk auth import
import { auth } from "@clerk/nextjs/server"; 

const f = createUploadthing();

// Utility function to get user authentication context (using Clerk)
const authenticateUser = async () => {
    // This function runs on the server. auth() reads the session cookie.
    const { userId } = await auth();
    
    // If you throw, the user will not be able to upload.
    if (!userId) {
        console.error("Uploadthing Unauthorized attempt.");
        throw new UploadThingError("Unauthorized");
    }
    
    // Return the authenticated userId
    return { userId };
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Keeping the confirmed endpoint name
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 40,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This runs on your server before upload
      const user = authenticateUser();

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: (await user).userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // We return the file URL, which is cleaner than ufsUrl
      return { uploadedFileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
