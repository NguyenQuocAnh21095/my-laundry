import Link from "next/link";

export default function Home() {
  return (
      <div className="items-center justify-center justify-items-center">
          <div className="flex items-center justify-center text-lg">Kính chào quý khách</div>
          <Link href="/login">
              Login
          </Link>
      </div>
  );
}
