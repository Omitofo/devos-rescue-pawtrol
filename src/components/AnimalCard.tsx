/**
 * Animal card for the public discovery grid — WP-05.
 */

import Link from "next/link";
import type { AnimalCard as AnimalCardType } from "@/lib/data/animals";

export function AnimalCard({ animal }: { animal: AnimalCardType }) {
  const location = [animal.city, animal.country_code].filter(Boolean).join(", ");

  return (
    <Link
      href={`/animals/${animal.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated transition hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {animal.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={animal.cover_image_url}
            alt={animal.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            {animal.species === "cat" ? "🐱" : animal.species === "dog" ? "🐶" : "🐾"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="text-base font-semibold text-primary group-hover:underline">
          {animal.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {[animal.breed, animal.age_group, animal.sex, animal.size]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}
        {animal.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-primary/80">
            {animal.summary}
          </p>
        )}
        {animal.organizations && (
          <p className="mt-auto pt-2 text-xs font-medium text-muted-foreground">
            {animal.organizations.name}
          </p>
        )}
      </div>
    </Link>
  );
}
