/**
 * Edit animal — WP-06 + WP-04 media.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgMember } from "@/lib/auth/session";
import { hasElevatedWindow } from "@/lib/auth/elevated";
import { getOrgAnimal } from "@/lib/data/workspace";
import { listAnimalMedia } from "@/lib/media/service";
import { AnimalForm } from "@/components/workspace/AnimalForm";
import { ElevatedReauthPanel } from "@/components/workspace/ElevatedReauthPanel";
import { MediaManager } from "@/components/workspace/MediaManager";

type Params = Promise<{ id: string }>;

export default async function EditAnimalPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireOrgMember();
  const animal = await getOrgAnimal(user.orgId!, id);
  if (!animal) notFound();

  const elevated = await hasElevatedWindow();
  const media = await listAnimalMedia(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/workspace" className="text-sm text-muted-foreground hover:text-primary">
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-primary">
            Edit {animal.name}
          </h1>
        </div>
        {animal.status === "published" && (
          <Link
            href={`/animals/${animal.id}`}
            className="text-sm text-accent-2 underline"
          >
            View public page
          </Link>
        )}
      </div>

      {!elevated && user.email && <ElevatedReauthPanel email={user.email} />}

      <MediaManager animalId={id} initialMedia={media} elevated={elevated} />

      <AnimalForm animal={animal} elevated={elevated} />
    </div>
  );
}
