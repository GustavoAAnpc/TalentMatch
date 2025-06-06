"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function OAuth2ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('Error desconocido en la autenticación');
  
  useEffect(() => {
    // Obtener el mensaje de error de los parámetros de la URL
    const message = searchParams.get('message');
    
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    }
    
    // Mostrar mensaje de error
    toast.error(`Error en la autenticación: ${errorMessage}`);
    
    // Redirigir a la página de login después de un tiempo
    const timeout = setTimeout(() => {
      router.push('/login');
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [searchParams, errorMessage, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Error de autenticación
          </h2>
          
          <div className="mt-8">
            <p className="text-red-600">{errorMessage}</p>
            <p className="mt-4 text-gray-600">
              Serás redirigido a la página de inicio de sesión en unos momentos...
            </p>
          </div>
          
          <div className="mt-8">
            <button 
              onClick={() => router.push('/login')} 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#38bdf8] hover:bg-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38bdf8]"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 