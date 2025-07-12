"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Building2, MapPin, Mail, Phone, Calendar, Edit, Camera, LinkIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { reclutadorService } from "@/services/reclutadorService"
import { authService } from "@/services/authService"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PerfilReclutador() {
  const { toast } = useToast()
  const [modoEdicion, setModoEdicion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  
  // Datos del perfil
  const [perfil, setPerfil] = useState<any>(null)
  
  // Campos editables
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [departamento, setDepartamento] = useState("")
  const [cargo, setCargo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  
  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setCargando(true)
        setError(null)
        
        const usuario = authService.getUsuario()
        if (!usuario || !usuario.id) {
          setError("No se pudo obtener la información del usuario actual")
          setCargando(false)
          return
        }
        
        const perfilData = await reclutadorService.obtenerReclutador(usuario.id)
        setPerfil(perfilData)
        
        // Inicializar los campos editables
        setNombre(perfilData.nombre || "")
        setApellido(perfilData.apellido || "")
        setTelefono(perfilData.telefono || "")
        setDepartamento(perfilData.departamento || "")
        setCargo(perfilData.cargo || "")
        setDescripcion(perfilData.descripcion || "")
        
      } catch (err: any) {
        console.error("Error al cargar el perfil:", err)
        setError(err.message || "Error al cargar el perfil")
      } finally {
        setCargando(false)
      }
    }
    
    cargarPerfil()
  }, [])
  
  // Función para actualizar el perfil
  const actualizarPerfil = async () => {
    try {
      const usuario = authService.getUsuario()
      if (!usuario || !usuario.id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener la información del usuario actual"
        })
        return
      }
      
      setGuardando(true)
      
      const datosActualizados = {
        nombre,
        apellido,
        telefono,
        departamento,
        cargo,
        descripcion
      }
      
      const perfilActualizado = await reclutadorService.actualizarReclutador(usuario.id, datosActualizados)
      
      // Actualizar la foto si se seleccionó una nueva
      if (archivoFoto) {
        setSubiendoFoto(true)
        await reclutadorService.actualizarFotoPerfil(usuario.id, archivoFoto)
        setArchivoFoto(null)
        setSubiendoFoto(false)
      }
      
      // Actualizar los datos en el estado
      setPerfil({...perfil, ...perfilActualizado})
      
      // Salir del modo edición
      setModoEdicion(false)
      
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente"
      })
      
    } catch (err: any) {
      console.error("Error al actualizar el perfil:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Error al actualizar el perfil"
      })
    } finally {
      setGuardando(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      
      // Verificar tipo de archivo
      const tiposValidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!tiposValidos.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Formato no válido",
          description: "Por favor, sube una imagen en formato JPG, PNG, GIF o WebP"
        })
        return
      }
      
      // Verificar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: "La imagen no debe superar los 5MB"
        })
        return
      }
      
      setArchivoFoto(file)
    }
  }
  
  // Si está cargando, mostrar skeleton
  if (cargando) {
    return <PerfilSkeleton />
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Si no hay datos del perfil
  if (!perfil) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin datos</AlertTitle>
          <AlertDescription>No se encontraron datos del perfil</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0a192f]">Mi Perfil</h1>
          <Button 
            onClick={modoEdicion ? actualizarPerfil : () => setModoEdicion(true)} 
            className="mt-4 md:mt-0"
            variant={modoEdicion ? "default" : "outline"}
            disabled={guardando}
          >
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : modoEdicion ? (
              "Guardar Cambios"
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Editar Perfil
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <Card className="md:max-w-[250px]">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-32 h-32">
                  {perfil.urlFoto ? (
                    <AvatarImage src={archivoFoto ? URL.createObjectURL(archivoFoto) : perfil.urlFoto} alt={perfil.nombre} />
                  ) : (
                    <AvatarFallback className="text-3xl">
                      {perfil.nombre.charAt(0)}{perfil.apellido.charAt(0)}
                    </AvatarFallback>
                  )}
                  </Avatar>

                  {modoEdicion && (
                  <div className="absolute bottom-0 right-0">
                    <label 
                      htmlFor="foto-input"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                    <input 
                      type="file" 
                      id="foto-input" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-center">{perfil.nombre} {perfil.apellido}</h3>
              <p className="text-sm text-muted-foreground text-center">{perfil.cargo || "Reclutador"}</p>

              <div className="w-full border-t mt-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground break-all">{perfil.email}</span>
                  </div>
                  {perfil.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{perfil.telefono}</span>
                    </div>
                  )}
                  {perfil.departamento && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{perfil.departamento}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Miembro desde {new Date(perfil.fechaCreacion).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {perfil.totalVacantes !== undefined && (
                <div className="w-full border-t mt-4 pt-4">
                  <p className="text-sm font-medium mb-2">Estadísticas</p>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vacantes publicadas:</span>
                      <span className="font-medium">{perfil.totalVacantes}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Información del perfil</CardTitle>
                <CardDescription>
                  {modoEdicion 
                    ? "Edita tu información personal para mantener tu perfil actualizado" 
                    : "Tu información personal y profesional"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex-1 space-y-4">
                  {modoEdicion ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input 
                          id="nombre" 
                          value={nombre} 
                          onChange={(e) => setNombre(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input 
                          id="apellido" 
                          value={apellido} 
                          onChange={(e) => setApellido(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input 
                          id="cargo" 
                          value={cargo} 
                          onChange={(e) => setCargo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento</Label>
                        <Input 
                          id="departamento" 
                          value={departamento} 
                          onChange={(e) => setDepartamento(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input 
                          id="telefono" 
                          value={telefono} 
                          onChange={(e) => setTelefono(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="descripcion">Acerca de mí</Label>
                        <Textarea
                          id="descripcion"
                          className="min-h-32"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Describe tu experiencia, especialidades y enfoque como reclutador..."
                        />
                      </div>
                    </div>
                  ) :
                    <>
                      <div>
                        <h2 className="text-2xl font-bold">{perfil.nombre} {perfil.apellido}</h2>
                        <p className="text-muted-foreground">{perfil.cargo || "Reclutador"}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {perfil.departamento && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{perfil.departamento}</span>
                        </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{perfil.email}</span>
                        </div>
                        {perfil.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{perfil.telefono}</span>
                        </div>
                        )}
                      </div>
                      
                      {perfil.descripcion ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Acerca de mí</h3>
                          <p className="whitespace-pre-line">{perfil.descripcion}</p>
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground text-center">
                            No hay información adicional. Edita tu perfil para añadir una descripción.
                          </p>
                      </div>
                      )}
                    </>
                  }
                </div>
              </CardContent>
          
                  {modoEdicion && (
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setModoEdicion(false)
                      setArchivoFoto(null)
                      // Restaurar los valores originales
                      setNombre(perfil.nombre || "")
                      setApellido(perfil.apellido || "")
                      setTelefono(perfil.telefono || "")
                      setDepartamento(perfil.departamento || "")
                      setCargo(perfil.cargo || "")
                      setDescripcion(perfil.descripcion || "")
                    }}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={actualizarPerfil} disabled={guardando}>
                    {guardando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : "Guardar cambios"}
                    </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Vacantes activas</CardTitle>
                <CardDescription>
                  Procesos de selección que estás gestionando actualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/reclutador/vacantes">
                    Ver mis vacantes
                    <LinkIcon className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
                    </div>
                    </div>
                    </div>
  );
}

// Esqueleto de carga para el perfil
function PerfilSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36 mt-4 md:mt-0" />
                  </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <div className="md:max-w-[250px]">
          <Skeleton className="h-[400px] w-full rounded-lg" />
                    </div>

        <div>
          <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
          <Skeleton className="h-[100px] w-full rounded-lg" />
                    </div>
                  </div>
    </div>
  );
}
