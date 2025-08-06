import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingWidget } from "@/components/widget/BookingWidget";
import { Toaster } from "sonner";

interface WidgetPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function WidgetPage({
  params,
  searchParams,
}: WidgetPageProps) {
  const { orgId } = await params;
  const { primaryColor = "#8ABF37", buttonColor = "#8ABF37" } =
    await searchParams;

  // Vérifier que l'organisation existe
  const organization = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });

  if (!organization) {
    notFound();
  }

  const config = {
    primaryColor,
    buttonColor,
    organizationId: orgId,
  };

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Réservation d&apos;espace - {organization.name}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            * {
              box-sizing: border-box;
            }
          `,
          }}
        />
      </head>
      <body>
        <div className="min-h-screen bg-white">
          <BookingWidget config={config} />
          <Toaster position="top-right" />
        </div>
      </body>
    </html>
  );
}
