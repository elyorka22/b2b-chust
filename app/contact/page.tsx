import Header from '@/components/Header';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
            Sotuvchi sifatida ro'yxatdan o'tish
          </h1>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-gray-700 mb-4">
              Sizning foydalanuvchi nomingiz yoki parolingiz tizimda topilmadi. 
              Sotuvchi sifatida ro'yxatdan o'tish uchun quyidagi ma'lumotlar bilan bog'laning:
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Bog'lanish ma'lumotlari</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">📞</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Telefon</p>
                    <p className="text-gray-600">+998 (90) 123-45-67</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">✉️</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">info@b2bchust.uz</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">💬</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Telegram</p>
                    <p className="text-gray-600">@b2bchust_support</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">📍</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Manzil</p>
                    <p className="text-gray-600">Chust shahri, O'zbekiston</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900">Qanday ishlaydi?</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Biz bilan bog'laning va sotuvchi sifatida ro'yxatdan o'tish so'rovingizni yuboring</li>
                <li>Biz sizga foydalanuvchi nomi va parol yaratamiz</li>
                <li>Yaratilgan ma'lumotlar bilan tizimga kirishingiz mumkin</li>
                <li>O'z mahsulotlaringizni qo'shish va buyurtmalarni boshqarishni boshlashingiz mumkin</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-center transition-colors"
              >
                Bosh sahifaga qaytish
              </Link>
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 text-center shadow-md hover:shadow-lg transition-all"
              >
                Qayta urinib ko'rish
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


