'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { contactPageApi } from '@/lib/api';

export default function ContactPage() {
  const [contactData, setContactData] = useState({
    title: 'Sotuvchi sifatida ro\'yxatdan o\'tish',
    description: 'Sizning foydalanuvchi nomingiz yoki parolingiz tizimda topilmadi. Sotuvchi sifatida ro\'yxatdan o\'tish uchun quyidagi ma\'lumotlar bilan bog\'laning:',
    phone: '',
    email: '',
    telegram: '',
    address: '',
    howItWorks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactPageApi.get()
      .then(data => {
        if (data) {
          setContactData({
            title: data.contact_page_title || contactData.title,
            description: data.contact_page_description || contactData.description,
            phone: data.contact_page_phone || '',
            email: data.contact_page_email || '',
            telegram: data.contact_page_telegram || '',
            address: data.contact_page_address || '',
            howItWorks: data.contact_page_how_it_works || [],
          });
        }
      })
      .catch(error => {
        console.error('Ошибка загрузки данных страницы контактов:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Yuklanmoqda...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
            {contactData.title}
          </h1>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-gray-700 mb-4">
              {contactData.description}
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Bog'lanish ma'lumotlari</h2>
              
              <div className="space-y-4">
                {contactData.phone && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">📞</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Telefon</p>
                      <p className="text-gray-800 font-medium">{contactData.phone}</p>
                    </div>
                  </div>
                )}

                {contactData.email && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">✉️</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-800 font-medium">{contactData.email}</p>
                    </div>
                  </div>
                )}

                {contactData.telegram && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">💬</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Telegram</p>
                      <p className="text-gray-800 font-medium">{contactData.telegram}</p>
                    </div>
                  </div>
                )}

                {contactData.address && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">📍</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Manzil</p>
                      <p className="text-gray-800 font-medium">{contactData.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {contactData.howItWorks && contactData.howItWorks.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-gray-900">Qanday ishlaydi?</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-800">
                  {contactData.howItWorks.map((item, index) => (
                    <li key={index} className="font-medium">{item}</li>
                  ))}
                </ul>
              </div>
            )}

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

