import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Migas de pan">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast ? <span className="breadcrumbs-sep" aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
