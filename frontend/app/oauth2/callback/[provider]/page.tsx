"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { GoogleAvatarImage } from "@/components/ui/google-avatar";

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const params = useParams();
  const { setIsAuthenticated, setUsuario } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [provider, setProvider] = useState<string>('');
  
  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        // Obtener el provider de los parámetros de la ruta
        const providerName = params.provider as string;
        setProvider(providerName);
        
        // Obtener el código de autorización de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          setError('No se recibió código de autorización');
          toast.error('Error en la autenticación: No se recibió código de autorización');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
        
        // Procesar el callback de OAuth2
        const response = await authService.manejarCallbackOAuth2(providerName, code);
        
        // Guardar los datos del usuario para mostrarlos
        setUserData(response.usuario);
        
        // Registrar los datos del usuario para depuración
        console.log(`OAuth2 ${providerName} - Datos del usuario:`, response.usuario);
        console.log(`OAuth2 ${providerName} - URL de imagen:`, response.usuario.urlFoto);
        
        // Actualizar el estado de autenticación
        setIsAuthenticated(true);
        setUsuario(response.usuario);
        
        // Mostrar mensaje de éxito
        toast.success(`¡Autenticación exitosa con ${providerName}!`);
        
        // Cambiar estado de carga
        setIsLoading(false);
        
        // Redirigir al dashboard después de un breve retraso para mostrar la confirmación
        setTimeout(() => router.push('/dashboard'), 2000);
      } catch (error) {
        console.error('Error en el callback de OAuth2:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido en la autenticación');
        toast.error(`Error en la autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsLoading(false);
        setTimeout(() => router.push('/login'), 3000);
      }
    };
    
    handleOAuth2Callback();
  }, [params, router, setIsAuthenticated, setUsuario]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Procesando autenticación...
            </h2>
            <div className="mt-8 flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#38bdf8]" />
              <p className="mt-4 text-gray-600">
                Estamos completando tu inicio de sesión, por favor espera...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Error de autenticación
            </h2>
            <div className="mt-8">
              <p className="text-red-600">{error}</p>
              <p className="mt-4 text-gray-600">
                Serás redirigido a la página de inicio de sesión en unos momentos...
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center">
              {provider === 'google' ? (
                <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
              ) : (
                <svg className="h-16 w-16" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/>
                </svg>
              )}
              <div className="ml-4 bg-green-100 rounded-full p-2 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Autorización exitosa
            </h2>
            
            {userData && (
              <div className="mt-6 flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4">
                  {userData.urlFoto ? (
                    <GoogleAvatarImage 
                      src={userData.urlFoto} 
                      alt={userData.nombre}
                    />
                  ) : null}
                  <AvatarFallback>{userData.nombre?.charAt(0)}{userData.apellido?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-lg font-medium">{userData.nombre} {userData.apellido}</p>
                <p className="text-gray-500">{userData.email}</p>
                <p className="mt-2 text-sm text-gray-600">Serás redirigido automáticamente...</p>
              </div>
            )}
            
            <Button 
              className="mt-6 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
              onClick={() => router.push('/dashboard')}
            >
              Continuar al Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 