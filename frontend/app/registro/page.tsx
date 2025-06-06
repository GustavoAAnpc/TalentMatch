"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { Github, Linkedin, Upload, FileCheck, FileQuestion, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { candidatoService } from "@/services/candidatoService";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function RegistroPage() {
  const router = useRouter();
  const { loginConOAuth2 } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  
  // Estados para la subida del CV
  const [cv, setCv] = useState<File | null>(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [analizandoCv, setAnalizandoCv] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [resultadoAnalisis, setResultadoAnalisis] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Verificar si las contraseñas coinciden cuando se modifica alguna de ellas
    if (name === "password" || name === "confirmPassword") {
      if (name === "confirmPassword" && value !== formData.password) {
        setErrorPassword("Las contraseñas no coinciden");
      } else if (name === "password" && value !== formData.confirmPassword && formData.confirmPassword) {
        setErrorPassword("Las contraseñas no coinciden");
      } else {
        setErrorPassword("");
      }
    }
  };
  
  // Manejar la selección de archivo CV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Comprobar el tamaño del archivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo excede el tamaño máximo permitido de 5MB");
        return;
      }
      
      // Comprobar el tipo de archivo
      const fileType = file.type;
      if (!fileType.match('application/pdf') && 
          !fileType.match('application/msword') && 
          !fileType.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !fileType.match('text/plain')) {
        toast.error("Formato de archivo no válido. Solo se permiten PDF, DOC, DOCX y TXT");
        return;
      }
      
      setCv(file);
      // Limpiar resultados previos de análisis si los hubiera
      setResultadoAnalisis(null);
    }
  };
  
  // Función para activar el diálogo de selección de archivo
  const activateFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Eliminar el CV seleccionado
  const eliminarCv = () => {
    setCv(null);
    setResultadoAnalisis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Analizar el CV con IA antes de enviarlo
  const analizarCv = async () => {
    if (!cv) return;
    
    try {
      setAnalizandoCv(true);
      const resultado = await candidatoService.analizarCurriculumConIA(cv);
      setResultadoAnalisis(resultado);
      toast.success("CV analizado correctamente");
    } catch (error) {
      toast.error("Error al analizar el CV: " + (error instanceof Error ? error.message : "Error desconocido"));
      console.error("Error analizando CV:", error);
    } finally {
      setAnalizandoCv(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!aceptaTerminos) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    setCargando(true);

    try {
      // Registrar el candidato
      const respuestaAuth = await authService.registrarCandidato({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        confirmacionPassword: formData.confirmPassword
      });

      toast.success("¡Registro exitoso!");
      
      // Si hay CV, subirlo
      if (cv) {
        setSubiendoCv(true);
        for (let i = 0; i <= 100; i += 10) {
          setProgresoSubida(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        try {
          // Subir el CV al perfil del candidato
          await candidatoService.subirCurriculum(respuestaAuth.id, cv);
          toast.success("CV subido correctamente");
        } catch (errorCv) {
          toast.error("Error al subir el CV: " + (errorCv instanceof Error ? errorCv.message : "Error desconocido"));
          console.error("Error subiendo CV:", errorCv);
        } finally {
          setSubiendoCv(false);
        }
      }

      // Redireccionar al login
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar la cuenta");
    } finally {
      setCargando(false);
    }
  };

  const handleLoginGoogle = async () => {
    try {
      await authService.loginConGoogle();
    } catch (error) {
      toast.error("Error al iniciar sesión con Google");
    }
  };

  const handleLoginGithub = async () => {
    try {
      await authService.loginConGithub();
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
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-md space-y-6 px-4 py-8 sm:px-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-[#0a192f]">Crea tu cuenta</h1>
            <p className="text-muted-foreground">Regístrate para acceder a todas las vacantes de Vertex</p>
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
                <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input 
                    id="first-name" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input 
                    id="last-name" 
                    name="apellido" 
                    value={formData.apellido} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
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
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input 
                  id="confirm-password" 
                  name="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
                {errorPassword && (
                  <p className="text-sm text-red-500">{errorPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="cv">Curriculum Vitae (opcional)</Label>
                  {cv && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={analizarCv} 
                      disabled={analizandoCv}
                      className="text-[#38bdf8] hover:text-[#0ea5e9] hover:bg-[#38bdf8]/10"
                    >
                      {analizandoCv ? "Analizando..." : "Analizar con IA"}
                    </Button>
                  )}
                </div>
                {!cv ? (
                  <div 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
                    onClick={activateFileInput}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOCX (MAX. 5MB)</p>
                    </div>
                    <Input 
                      ref={fileInputRef}
                      id="cv-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx,.doc,.txt" 
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium truncate">{cv.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={eliminarCv}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                    
                    {/* Mostrar información del análisis de CV si está disponible */}
                    {resultadoAnalisis && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <FileCheck className="h-4 w-4 text-[#38bdf8] mr-1" />
                          Análisis de tu CV
                        </h4>
                        <div className="space-y-2">
                          {resultadoAnalisis.tituloProfesional && (
                            <div className="text-xs">
                              <span className="font-medium">Título profesional:</span> {resultadoAnalisis.tituloProfesional}
                            </div>
                          )}
                          {resultadoAnalisis.anosExperiencia !== undefined && (
                            <div className="text-xs">
                              <span className="font-medium">Experiencia:</span> {resultadoAnalisis.anosExperiencia} años
                            </div>
                          )}
                          {resultadoAnalisis.habilidadesTecnicas && resultadoAnalisis.habilidadesTecnicas.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium">Habilidades principales:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {resultadoAnalisis.habilidadesTecnicas.slice(0, 5).map((habilidad: string, index: number) => (
                                  <Badge key={`${habilidad.trim()}-${index}`} variant="outline" className="text-[10px]">
                                    {habilidad}
                                  </Badge>
                                ))}
                                {resultadoAnalisis.habilidadesTecnicas.length > 5 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{resultadoAnalisis.habilidadesTecnicas.length - 5} más
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Mostrar progreso de subida durante el registro */}
                    {subiendoCv && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Subiendo CV...</span>
                          <span>{progresoSubida}%</span>
                        </div>
                        <Progress value={progresoSubida} className="h-1" />
                      </div>
                    )}
                </div>
                )}
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  className="mt-1" 
                  checked={aceptaTerminos} 
                  onCheckedChange={(checked) => setAceptaTerminos(checked as boolean)} 
                />
                <Label htmlFor="terms" className="text-sm font-normal">
                  Acepto los <Link href="/terminos" className="text-[#38bdf8] hover:underline">términos y condiciones</Link> y la <Link href="/privacidad" className="text-[#38bdf8] hover:underline">política de privacidad</Link>
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
                disabled={cargando}
              >
                {cargando ? "Procesando..." : "Crear cuenta"}
              </Button>
              <div className="text-center text-sm">
                ¿Ya tienes una cuenta? <Link href="/login" className="text-[#38bdf8] hover:underline">Inicia sesión</Link>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
