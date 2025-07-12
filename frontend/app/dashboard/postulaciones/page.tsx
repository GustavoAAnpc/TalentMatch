"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter, Eye, BrainCircuit, Calendar, MapPin, Briefcase, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { authService } from "@/services/authService"
import { postulacionService } from "@/services/postulacionService"
import { EstadoPostulacion, PostulacionResumenResponse } from "@/types/postulacion"

export default function PostulacionesPage() {
  const router = useRouter();
  const [postulaciones, setPostulaciones] = useState<PostulacionResumenResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("all");

  // Comprobar autenticación y cargar datos del usuario
  useEffect(() => {
    const verificarUsuario = () => {
      const usuarioActual = authService.getUsuario();
      
      if (!usuarioActual || !usuarioActual.id) {
        router.push("/login");
        return null;
      }
      
      if (usuarioActual.rol !== "CANDIDATO") {
        router.push("/");
        return null;
      }
      
      return usuarioActual;
    };
    
    const usuarioActual = verificarUsuario();
    if (usuarioActual) {
      cargarPostulaciones(usuarioActual.id);
    }
  }, [router]);

  // Cargar postulaciones del usuario
  const cargarPostulaciones = async (candidatoId: number) => {
    try {
      setCargando(true);
      setError(null);
      
      const datos = await postulacionService.obtenerPostulaciones(candidatoId);
      setPostulaciones(datos || []);
      
      console.log('Postulaciones cargadas:', datos?.length || 0);
    } catch (err: any) {
      console.error('Error al cargar postulaciones:', err);
      setError(err.message || 'Error al cargar las postulaciones');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar postulaciones según la pestaña activa
  const filtrarPostulaciones = () => {
    // Primero filtrar por búsqueda de texto
    let filtradas = postulaciones.filter(post => 
      post.vacanteTitulo.toLowerCase().includes(busqueda.toLowerCase())
    );
    
    // Luego filtrar por estado según la pestaña
    if (tabActiva === "active") {
      filtradas = filtradas.filter(post => 
        post.estado !== EstadoPostulacion.RECHAZADO && 
        post.estado !== EstadoPostulacion.SELECCIONADO
      );
    } else if (tabActiva === "completed") {
      filtradas = filtradas.filter(post => 
        post.estado === EstadoPostulacion.RECHAZADO || 
        post.estado === EstadoPostulacion.SELECCIONADO
      );
    }
    
    return filtradas;
  };

  // Obtener el color de badge según el estado
  const obtenerColorEstado = (estado: EstadoPostulacion) => {
    switch (estado) {
      case EstadoPostulacion.APLICADA:
        return "bg-blue-500";
      case EstadoPostulacion.EN_REVISION:
        return "bg-yellow-500";
      case EstadoPostulacion.PRUEBA_PENDIENTE:
        return "bg-orange-500";
      case EstadoPostulacion.PRUEBA_COMPLETADA:
        return "bg-indigo-500";
      case EstadoPostulacion.ENTREVISTA:
        return "bg-purple-500";
      case EstadoPostulacion.SELECCIONADO:
        return "bg-green-500";
      case EstadoPostulacion.RECHAZADO:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Traducir estado a español
  const traducirEstado = (estado: EstadoPostulacion) => {
    switch (estado) {
      case EstadoPostulacion.APLICADA:
        return "Aplicada";
      case EstadoPostulacion.EN_REVISION:
        return "En revisión";
      case EstadoPostulacion.PRUEBA_PENDIENTE:
        return "Prueba pendiente";
      case EstadoPostulacion.PRUEBA_COMPLETADA:
        return "Prueba completada";
      case EstadoPostulacion.ENTREVISTA:
        return "Entrevista";
      case EstadoPostulacion.SELECCIONADO:
        return "Seleccionado";
      case EstadoPostulacion.RECHAZADO:
        return "Rechazado";
      default:
        return estado;
    }
  };

  // Obtener próximo paso según estado
  const obtenerProximoPaso = (estado: EstadoPostulacion) => {
    switch (estado) {
      case EstadoPostulacion.APLICADA:
        return "Esperando revisión del reclutador";
      case EstadoPostulacion.EN_REVISION:
        return "Tu perfil está siendo revisado";
      case EstadoPostulacion.PRUEBA_PENDIENTE:
        return "Debes completar una prueba técnica";
      case EstadoPostulacion.PRUEBA_COMPLETADA:
        return "Esperando revisión de tu prueba";
      case EstadoPostulacion.ENTREVISTA:
        return "Próximamente te contactarán para una entrevista";
      case EstadoPostulacion.SELECCIONADO:
        return "¡Felicidades! Has sido seleccionado";
      case EstadoPostulacion.RECHAZADO:
        return "Proceso finalizado";
      default:
        return "Estado desconocido";
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-ES', options);
  };

  // Si está cargando, mostrar esqueletos de carga
  if (cargando) {
    return <SkeletonPostulaciones />;
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const postulacioesFiltradas = filtrarPostulaciones();

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Mis Postulaciones</h1>
          <p className="text-gray-300 mt-1">
          Gestiona y haz seguimiento de tus procesos de selección activos e históricos
        </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={setTabActiva}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
          <div className="mt-3 flex items-center gap-2 sm:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por título..."
                className="w-full pl-8 sm:w-[200px] md:w-[300px]"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Todas las postulaciones</CardTitle>
              <CardDescription>Visualiza todas tus postulaciones en un solo lugar</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              {postulacioesFiltradas.length > 0 ? (
              <div className="space-y-4">
                  {postulacioesFiltradas.map((postulacion) => (
                  <div
                      key={postulacion.id}
                    className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#0a192f]">{postulacion.vacanteTitulo}</h3>
                          <Badge className={`${obtenerColorEstado(postulacion.estado)} text-white hover:${obtenerColorEstado(postulacion.estado)}`}>
                            {traducirEstado(postulacion.estado)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{formatearFecha(postulacion.fechaCreacion)}</span>
                        </div>
                        </div>
                        {postulacion.puntuacionMatch && (
                      <div className="flex items-center gap-2 pt-1">
                        <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                        <span className="text-sm font-medium text-[#38bdf8]">
                              {postulacion.puntuacionMatch}% compatibilidad
                        </span>
                      </div>
                        )}
                      <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Próximo paso:</span> {obtenerProximoPaso(postulacion.estado)}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end sm:mt-0">
                        <Link href={`/dashboard/postulaciones/${postulacion.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay postulaciones</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No tienes postulaciones que coincidan con los filtros seleccionados.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push('/vacantes')} variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Explorar vacantes disponibles
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Postulaciones activas</CardTitle>
              <CardDescription>Procesos de selección en curso</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              {postulacioesFiltradas.length > 0 ? (
              <div className="space-y-4">
                  {postulacioesFiltradas.map((postulacion) => (
                    <div
                      key={postulacion.id}
                      className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#0a192f]">{postulacion.vacanteTitulo}</h3>
                          <Badge className={`${obtenerColorEstado(postulacion.estado)} text-white hover:${obtenerColorEstado(postulacion.estado)}`}>
                            {traducirEstado(postulacion.estado)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{formatearFecha(postulacion.fechaCreacion)}</span>
                          </div>
                        </div>
                        {postulacion.puntuacionMatch && (
                        <div className="flex items-center gap-2 pt-1">
                          <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                          <span className="text-sm font-medium text-[#38bdf8]">
                              {postulacion.puntuacionMatch}% compatibilidad
                          </span>
                        </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Próximo paso:</span> {obtenerProximoPaso(postulacion.estado)}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end sm:mt-0">
                        <Link href={`/dashboard/postulaciones/${postulacion.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay postulaciones activas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No tienes postulaciones activas en este momento.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push('/vacantes')} variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Explorar vacantes disponibles
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Postulaciones completadas</CardTitle>
              <CardDescription>Procesos de selección finalizados</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              {postulacioesFiltradas.length > 0 ? (
              <div className="space-y-4">
                  {postulacioesFiltradas.map((postulacion) => (
                    <div
                      key={postulacion.id}
                      className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#0a192f]">{postulacion.vacanteTitulo}</h3>
                          <Badge className={`${obtenerColorEstado(postulacion.estado)} text-white hover:${obtenerColorEstado(postulacion.estado)}`}>
                            {traducirEstado(postulacion.estado)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{formatearFecha(postulacion.fechaCreacion)}</span>
                          </div>
                        </div>
                        {postulacion.puntuacionMatch && (
                        <div className="flex items-center gap-2 pt-1">
                          <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                          <span className="text-sm font-medium text-[#38bdf8]">
                              {postulacion.puntuacionMatch}% compatibilidad
                          </span>
                        </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Estado final:</span> {obtenerProximoPaso(postulacion.estado)}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end sm:mt-0">
                        <Link href={`/dashboard/postulaciones/${postulacion.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay postulaciones completadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No tienes postulaciones completadas en este momento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente de esqueletos para la carga
function SkeletonPostulaciones() {
  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <Skeleton className="h-8 w-48 bg-white/20" />
          <Skeleton className="h-4 w-72 bg-white/20 mt-2" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  )
}
