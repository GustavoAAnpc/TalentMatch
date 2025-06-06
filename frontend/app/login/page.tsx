"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Github, Mail } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/authService"

export default function LoginPage() {
  const router = useRouter();
  const { login, error, loading, clearError, enableDemoMode, loginConOAuth2 } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Limpiar errores al montar el componente o cambiar de ruta
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verificar si son credenciales de demo
    const isDemoCredentials = 
      (formData.email === 'candidato@demo.com' && formData.password === 'candidato') ||
      (formData.email === 'reclutador@demo.com' && formData.password === 'reclutador') ||
      (formData.email === 'admin@demo.com' && formData.password === 'admin');

    // Si son credenciales de demo, primero verificar si el backend está disponible
    if (isDemoCredentials) {
      try {
        // Intentar hacer una petición simple al backend para verificar si está disponible
        const response = await fetch('http://localhost:8080/api/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Timeout corto para no esperar demasiado
          signal: AbortSignal.timeout(2000)
        });
        
        // Si el backend responde, no permitir el modo demo
        if (response.ok) {
          toast.error("El modo de demostración solo está disponible cuando el backend no está activo");
          return;
        }
      } catch (error) {
        // Si hay un error, significa que el backend no está disponible, activar modo demo
        if (formData.email === 'candidato@demo.com' && formData.password === 'candidato') {
          enableDemoMode('CANDIDATO');
          toast.success("¡Modo de demostración activado como Candidato!");
          return;
        } else if (formData.email === 'reclutador@demo.com' && formData.password === 'reclutador') {
          enableDemoMode('RECLUTADOR');
          toast.success("¡Modo de demostración activado como Reclutador!");
          return;
        } else if (formData.email === 'admin@demo.com' && formData.password === 'admin') {
          enableDemoMode('ADMINISTRADOR');
          toast.success("¡Modo de demostración activado como Administrador!");
          return;
        }
      }
    }

    try {
      // Intento de inicio de sesión normal
      await login(formData.email, formData.password);
      toast.success("¡Inicio de sesión exitoso!");
      
      // La redirección se manejará en el AuthProvider
      router.push("/dashboard");
    } catch (error) {
      // El error ya se maneja en el contexto, pero podemos mostrar un toast adicional
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión");
    }
  };

  const handleLoginGoogle = async () => {
    try {
      await loginConOAuth2('google');
    } catch (error) {
      toast.error("Error al iniciar sesión con Google");
    }
  };

  const handleLoginGithub = async () => {
    try {
      await loginConOAuth2('github');
    } catch (error) {
      toast.error("Error al iniciar sesión con GitHub");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="mx-auto max-w-md space-y-6 px-4 py-8 sm:px-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-[#0a192f]">Iniciar sesión</h1>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder a tu cuenta</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLoginGithub}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLoginGoogle}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/recuperar-password" className="text-sm text-[#38bdf8] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Recordar mi sesión
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a192f]"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </div>
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/registro" className="text-[#38bdf8] hover:underline">
              Regístrate
            </Link>
          </div>
          

        </div>
      </main>
      <Footer />
    </div>
  )
}
