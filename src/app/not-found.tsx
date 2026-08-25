import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-8 text-center">
      <div>
        <p className="num text-5xl font-extrabold tracking-tight text-ink-faint">404</p>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">That screen doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to today
        </Link>
      </div>
    </div>
  );
}
