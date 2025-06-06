"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { GoogleAvatarImage } from "@/components/ui/google-avatar";

interface JwtPayload {
  userId: number;
  sub: string;
  iat: number;
  exp: number;
}

interface UserData {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  urlFoto?: string;
}

export default function OAuth2SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIsAuthenticated, setUsuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processOAuth2Success = async () => {
      try {
        // Obtener el token de los parámetros de la URL
        const token = searchParams.get('token');
        
        if (!token) {
          setError('No se recibió token de autenticación');
          toast.error('Error en la autenticación: No se recibió token');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        // Guardar el token
        Cookies.set('token', token, { expires: 7 });
        localStorage.setItem('auth_token', token);
        
        // Decodificar el token para obtener el ID de usuario
        const decoded = jwtDecode<JwtPayload>(token);
        
        // Obtener los datos del usuario
        const userInfo = await fetchUserData(decoded.userId, token);
        
        if (!userInfo) {
          setError('No se pudieron obtener los datos del usuario');
          toast.error('Error al cargar los datos del usuario');
          setLoading(false);
          return;
        }
        
        // Crear objeto de usuario
        const usuarioData: UserData = {
          id: userInfo.id,
          email: userInfo.email,
          nombre: userInfo.nombre || 'Usuario',
          apellido: userInfo.apellido || '',
          rol: userInfo.rol,
          urlFoto: userInfo.urlFoto || ''
        };
        
        // Guardar datos de usuario
        localStorage.setItem('user_data', JSON.stringify(usuarioData));
        Cookies.set('usuario', JSON.stringify(usuarioData), { expires: 7 });
        
        // Actualizar estado
        setUsuario(usuarioData);
        setIsAuthenticated(true);
        setUserData(usuarioData);
        
        // Mostrar mensaje de éxito
        toast.success('¡Autenticación exitosa!');
        
        // Cambiar estado de carga
        setLoading(false);
        
        // Redirigir al dashboard después de un breve retraso
        setTimeout(() => {
          const redirectPath = getRedirectPathByRole(usuarioData.rol);
          router.push(redirectPath);
        }, 2000);
        
      } catch (error) {
        console.error('Error procesando la autenticación OAuth2:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        toast.error(`Error en la autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setLoading(false);
      }
    };
    
    processOAuth2Success();
  }, [searchParams, router, setIsAuthenticated, setUsuario]);
  
  /**
   * Obtiene los datos del usuario desde el backend
   */
  const fetchUserData = async (userId: number, token: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/usuarios/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Error al obtener datos del usuario');
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en la solicitud de datos del usuario:', error);
      return null;
    }
  };
  
  /**
   * Determina la ruta de redirección según el rol del usuario
   */
  const getRedirectPathByRole = (rol: string): string => {
    switch (rol) {
      case 'RECLUTADOR':
        return '/reclutador';
      case 'ADMINISTRADOR':
        return '/admin';
      case 'CANDIDATO':
      default:
        return '/dashboard';
    }
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Error de autenticación
            </h2>
            <p className="mt-4 text-red-600">{error}</p>
            <Button 
              className="mt-6 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
              onClick={() => router.push('/login')}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Completando autenticación...
            </h2>
            <div className="mt-8 flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#38bdf8]" />
              <p className="mt-4 text-gray-600">
                Estamos completando tu inicio de sesión, por favor espera...
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-3 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-500" />
              </div>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              ¡Autenticación exitosa!
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
              onClick={() => router.push(userData ? getRedirectPathByRole(userData.rol) : '/dashboard')}
            >
              Continuar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}