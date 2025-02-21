import Link from "next/link";

export default function Home() {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-700">Kính chào quý khách</div>
              <Link
                  href="/login"
                  className="mt-4 w-full text-center py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                  Đăng nhập
              </Link>
          </div>
      </div>

  );
}
