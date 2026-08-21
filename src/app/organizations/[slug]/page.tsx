/**
 * Organization public profile — WP-05 (J-03).
 *
 * Contact section is the single source of truth for how to reach the rescue.
 * Animal detail CTA lands here at #contact.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { AnimalCard } from "@/components/AnimalCard";
import { getActiveOrgBySlug } from "@/lib/data/organizations";
import { listOrgPublishedAnimals } from "@/lib/data/animals";

type Params = Promise<{ slug: string }>;

export default async function OrgProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const org = await getActiveOrgBySlug(slug);

  if (!org) notFound();

  const animals = await listOrgPublishedAnimals(org.id);
  const location = [org.city, org.subdivision, org.country_code]
    .filter(Boolean)
    .join(", ");

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

        <header className="mb-10 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            {org.name}
          </h1>
          {location && (
            <p className="text-muted-foreground">{location}</p>
          )}
          {org.description && (
            <p className="max-w-2xl text-primary/85">{org.description}</p>
          )}
        </header>

        {/* Contact section — destination of interest CTA */}
        <section
          id="contact"
          className="mb-12 scroll-mt-8 rounded-xl border border-border bg-surface-elevated p-6"
        >
          <h2 className="text-lg font-semibold text-primary">
            How to reach us
          </h2>
          {org.cta_text && (
            <p className="mt-2 text-sm text-primary/90">{org.cta_text}</p>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            {org.public_email && (
              <li>
                <span className="text-muted-foreground">Email: </span>
                <a
                  href={`mailto:${org.public_email}`}
                  className="font-medium text-primary underline"
                >
                  {org.public_email}
                </a>
              </li>
            )}
            {org.public_phone && (
              <li>
                <span className="text-muted-foreground">Phone: </span>
                <span className="font-medium text-primary">{org.public_phone}</span>
              </li>
            )}
            {org.website_url && (
              <li>
                <span className="text-muted-foreground">Website: </span>
                <a
                  href={org.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  {org.website_url}
                </a>
              </li>
            )}
            {!org.public_email && !org.public_phone && !org.website_url && (
              <li className="text-muted-foreground">
                This organisation has not published contact details yet.
              </li>
            )}
          </ul>
        </section>

        {/* Published animals */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-primary">
            Animals available
          </h2>
          {animals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published animals at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
