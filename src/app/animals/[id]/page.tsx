/**
 * Animal detail — WP-05 + WP-04 gallery.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { InterestCta } from "@/components/InterestCta";
import { getPublishedAnimal } from "@/lib/data/animals";
import { listAnimalMedia } from "@/lib/media/service";

type Params = Promise<{ id: string }>;

export default async function AnimalDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const animal = await getPublishedAnimal(id);

  if (!animal) notFound();

  const media = await listAnimalMedia(id);
  const hero =
    media[0]?.public_url ?? animal.cover_image_url ?? null;

  const org = animal.organizations;
  const location = [animal.city, animal.subdivision, animal.country_code]
    .filter(Boolean)
    .join(", ");

  const attributes = [
    animal.species,
    animal.breed,
    animal.age_group,
    animal.sex,
    animal.size,
  ].filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-primary"
        >
          ← All animals
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero}
                  alt={animal.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">
                  {animal.species === "cat"
                    ? "🐱"
                    : animal.species === "dog"
                      ? "🐶"
                      : "🐾"}
                </div>
              )}
            </div>
            {media.length > 1 && (
              <ul className="grid grid-cols-4 gap-2">
                {media.map((m) => (
                  <li
                    key={m.id}
                    className="aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.public_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-primary">
                {animal.name}
              </h1>
              {location && (
                <p className="mt-1 text-muted-foreground">{location}</p>
              )}
            </div>

            <ul className="flex flex-wrap gap-2">
              {attributes.map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-primary"
                >
                  {a}
                </li>
              ))}
            </ul>

            {animal.summary && (
              <p className="text-base text-primary/90">{animal.summary}</p>
            )}

            {animal.description && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  About
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-primary/85">
                  {animal.description}
                </p>
              </div>
            )}

            {animal.special_needs && (
              <div className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm">
                <span className="font-medium">Special needs: </span>
                {animal.special_needs}
              </div>
            )}

            {org && (
              <div className="space-y-3 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Cared for by{" "}
                  <Link
                    href={`/organizations/${org.slug}`}
                    className="font-medium text-primary underline"
                  >
                    {org.name}
                  </Link>
                </p>
                <InterestCta
                  animalId={animal.id}
                  orgId={org.id}
                  orgSlug={org.slug}
                  ctaText={org.cta_text}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
