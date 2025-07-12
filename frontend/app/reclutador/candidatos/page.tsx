"use client"

import { useEffect, useState } from "react"
import { ArrowUpDown, ChevronDown, Filter, MoreHorizontal, Search, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { candidatoService } from "@/services/candidatoService"
import { authService } from "@/services/authService"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatearFecha } from "@/lib/utils"

// Definir un tipo para los campos de búsqueda
type TipoBusqueda = "nombre" | "tituloProfesional" | "ubicacion" | "experienciaAnios";

// Estados disponibles para candidatos
const ESTADOS_CANDIDATO = [
  "Activo",
  "Inactivo",
  "En proceso",
  "Contratado",
  "Rechazado",
  "Pendiente de evaluación"
];

export default function CandidatesPage() {
  const router = useRouter();
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el tipo de búsqueda
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("nombre");
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    tituloProfesional: "",
    nombre: "",
    habilidad: "",
    experienciaMinima: undefined as number | undefined,
    experienciaAnios: "",
    ubicacion: "",
    disponibilidadInmediata: undefined as boolean | undefined,
    pagina: 0,
    tamanio: 10,
    ordenarPor: "id",
    direccion: "asc"
  });
  
  // Estado para modal de cambio de estado
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<any>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  
  // Estado para paginación
  const [paginacion, setPaginacion] = useState({
    paginaActual: 0,
    totalPaginas: 0,
    totalElementos: 0,
    esPrimera: true,
    esUltima: false
  });

  // Verificar autenticación
  useEffect(() => {
    const usuario = authService.getUsuario();
    
    if (!usuario || !usuario.id) {
      router.push("/login");
      return;
    }
    
    if (usuario.rol !== "RECLUTADOR" && usuario.rol !== "ADMIN") {
      router.push("/");
      return;
    }
    
    cargarCandidatos();
  }, [router]);
  
  // Cargar candidatos desde el backend
  const cargarCandidatos = async () => {
    // Si es una carga inicial, mostrar skeleton completo
    // Si es por búsqueda o cambio de filtros, no mostrar skeleton
    if (!cargandoBusqueda) {
    setCargando(true);
    }
    setError(null);
    
    try {
      const respuesta = await candidatoService.filtrarCandidatos(filtros);
      
      console.log("Datos recibidos de candidatos:", respuesta.contenido);
      
      // Verificar los estados de cada candidato para depuración
      if (respuesta.contenido && respuesta.contenido.length > 0) {
        respuesta.contenido.forEach((candidato: any) => {
          console.log(`Candidato ${candidato.id} - Estado: "${candidato.estadoProceso}"`);
        });
      }
      
      setCandidatos(respuesta.contenido || []);
      setPaginacion({
        paginaActual: respuesta.numeroPagina,
        totalPaginas: respuesta.totalPaginas,
        totalElementos: respuesta.totalElementos,
        esPrimera: respuesta.esPrimera,
        esUltima: respuesta.esUltima
      });
    } catch (err: any) {
      setError(err.message || "Error al cargar candidatos");
      toast.error("No se pudieron cargar los candidatos");
    } finally {
      setCargando(false);
      setCargandoBusqueda(false);
    }
  };
  
  // Manejar cambio de página
  const cambiarPagina = (nuevaPagina: number) => {
    // Activar cargandoBusqueda para evitar mostrar skeleton
    setCargandoBusqueda(true);
    setFiltros({
      ...filtros,
      pagina: nuevaPagina
    });
  };
  
  // Manejar cambio de búsqueda
  const manejarCambioBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    // Solo establecer cargandoBusqueda en true para evitar mostrar skeleton completo
    setCargandoBusqueda(true);
    
    // Resetear todos los campos de búsqueda
    const nuevosFiltros = {
      ...filtros,
      tituloProfesional: "",
      nombre: "",
      ubicacion: "",
      experienciaAnios: "",
      pagina: 0
    };
    
    // Establecer el campo específico según el tipo de búsqueda
    switch (tipoBusqueda) {
      case "tituloProfesional":
        nuevosFiltros.tituloProfesional = valor;
        break;
      case "nombre":
        nuevosFiltros.nombre = valor;
        break;
      case "ubicacion":
        nuevosFiltros.ubicacion = valor;
        break;
      case "experienciaAnios":
        nuevosFiltros.experienciaAnios = valor;
        break;
    }
    
    setFiltros(nuevosFiltros);
  };
  
  // Manejar cambio de tipo de búsqueda
  const manejarCambioTipoBusqueda = (valor: TipoBusqueda) => {
    setTipoBusqueda(valor);
    setBusqueda("");
    
    // Activar cargandoBusqueda para evitar mostrar skeleton
    setCargandoBusqueda(true);
    
    // Resetear todos los campos de búsqueda
    const nuevosFiltros = {
      ...filtros,
      tituloProfesional: "",
      nombre: "",
      ubicacion: "",
      experienciaAnios: "",
      pagina: 0
    };
    
    setFiltros(nuevosFiltros);
  };
  
  // Aplicar filtros
  const aplicarFiltros = (nuevosFiltros: any) => {
    // Activar cargandoBusqueda para evitar mostrar skeleton
    setCargandoBusqueda(true);
    
    setFiltros({
      ...filtros,
      ...nuevosFiltros,
      pagina: 0 // Resetear a primera página
    });
  };
  
  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    // Resetear búsqueda
    setBusqueda("");
    
    // Resetear tipo de búsqueda al valor por defecto
    setTipoBusqueda("nombre");
    
    // Activar cargandoBusqueda para evitar mostrar skeleton
    setCargandoBusqueda(true);
    
    // Resetear todos los filtros a valores por defecto
    setFiltros({
      tituloProfesional: "",
      nombre: "",
      habilidad: "",
      experienciaAnios: "",
      experienciaMinima: undefined,
      ubicacion: "",
      disponibilidadInmediata: undefined,
      pagina: 0,
      tamanio: 10,
      ordenarPor: "id",
      direccion: "asc"
    });
  };
  
  // Obtener placeholder según tipo de búsqueda
  const obtenerPlaceholder = () => {
    switch (tipoBusqueda) {
      case "nombre":
        return "Buscar por nombre del candidato...";
      case "tituloProfesional":
        return "Buscar por puesto...";
      case "ubicacion":
        return "Buscar por ubicación...";
      case "experienciaAnios":
        return "Buscar por años de experiencia...";
      default:
        return "Buscar...";
    }
  };
  
  // Efecto para cargar candidatos cuando cambian los filtros
  useEffect(() => {
    cargarCandidatos();
  }, [filtros]);

  // Función para manejar el cambio de estado de un candidato
  const handleCambiarEstado = (candidato: any) => {
    setCandidatoSeleccionado(candidato);
    setNuevoEstado("");
    setModalEstadoAbierto(true);
  };

  // Función para actualizar el estado de un candidato
  const actualizarEstadoCandidato = async () => {
    if (!candidatoSeleccionado || !nuevoEstado) {
      toast.error("Por favor seleccione un estado válido");
      return;
    }

    try {
      // Llamar al servicio para actualizar el estado
      await candidatoService.actualizarEstadoCandidato(candidatoSeleccionado.id, nuevoEstado);
      
      // Mostrar mensaje de éxito
      toast.success(`Estado del candidato ${candidatoSeleccionado.nombre} cambiado a: ${nuevoEstado}`);
      
      // Cerrar el modal
      setModalEstadoAbierto(false);
      
      // Recargar la lista de candidatos
      cargarCandidatos();
    } catch (error) {
      console.error("Error al cambiar el estado:", error);
      toast.error("Error al cambiar el estado del candidato");
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Candidatos</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluación de Candidatos</CardTitle>
          <CardDescription>Gestiona y evalúa a los candidatos para tus vacantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex w-full max-w-xl items-center space-x-3">
              <Select 
                value={tipoBusqueda} 
                onValueChange={manejarCambioTipoBusqueda}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tipo de búsqueda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="tituloProfesional">Puesto</SelectItem>
                  <SelectItem value="ubicacion">Ubicación</SelectItem>
                  <SelectItem value="experienciaAnios">Experiencia</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder={obtenerPlaceholder()} 
                className="w-[350px]"
                value={busqueda}
                onChange={manejarCambioBusqueda}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={limpiarFiltros}
              >
                Limpiar filtros
                  </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Nombre</span>
                      <ArrowUpDown 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => aplicarFiltros({
                          ordenarPor: "nombre",
                          direccion: filtros.ordenarPor === "nombre" && filtros.direccion === "asc" ? "desc" : "asc"
                        })}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Puesto</span>
                      <ArrowUpDown 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => aplicarFiltros({
                          ordenarPor: "tituloProfesional",
                          direccion: filtros.ordenarPor === "tituloProfesional" && filtros.direccion === "asc" ? "desc" : "asc"
                        })}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Experiencia</span>
                      <ArrowUpDown 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => aplicarFiltros({
                          ordenarPor: "experienciaAnios",
                          direccion: filtros.ordenarPor === "experienciaAnios" && filtros.direccion === "asc" ? "desc" : "asc"
                        })}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Estado</span>
                      <ArrowUpDown 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => aplicarFiltros({
                          ordenarPor: "estadoProceso",
                          direccion: filtros.ordenarPor === "estadoProceso" && filtros.direccion === "asc" ? "desc" : "asc"
                        })}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Fecha registro</span>
                      <ArrowUpDown 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => aplicarFiltros({
                          ordenarPor: "fechaCreacion",
                          direccion: filtros.ordenarPor === "fechaCreacion" && filtros.direccion === "asc" ? "desc" : "asc"
                        })}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando && !cargandoBusqueda ? (
                  // Mostrar esqueletos solo durante la carga inicial, no durante búsquedas
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  // Mostrar mensaje de error
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : candidatos.length === 0 ? (
                  // Mostrar mensaje cuando no hay candidatos
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No se encontraron candidatos que coincidan con los criterios de búsqueda
                    </TableCell>
                  </TableRow>
                ) : (
                  // Mostrar candidatos
                  candidatos.map((candidato) => (
                    <TableRow key={candidato.id}>
                      <TableCell>{`${candidato.nombre} ${candidato.apellido || ''}`}</TableCell>
                      <TableCell>{candidato.tituloProfesional || 'No especificado'}</TableCell>
                      <TableCell>{candidato.ubicacion || 'No especificada'}</TableCell>
                      <TableCell className="text-center">
                        {candidato.experienciaAnios ? `${candidato.experienciaAnios} años` : 'Sin registrar'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={`inline-flex justify-center items-center min-w-[120px] px-4 py-1.5 text-xs font-medium border ${
                            !candidato.estadoProceso ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200" :
                            candidato.estadoProceso.toLowerCase() === "activo" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : 
                            candidato.estadoProceso.toLowerCase() === "inactivo" ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200" :
                            candidato.estadoProceso.toLowerCase() === "contratado" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" :
                            candidato.estadoProceso.toLowerCase() === "en proceso" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200" : 
                            candidato.estadoProceso.toLowerCase() === "pendiente de evaluación" ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200" : 
                            candidato.estadoProceso.toLowerCase() === "rechazado" ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : 
                            "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
                          }`}
                        >
                          {candidato.estadoProceso || 'Sin estado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(candidato.fechaCreacion)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/reclutador/candidatos/${candidato.id}`)}>
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => candidato.urlCurriculum 
                                ? window.open(candidato.urlCurriculum, '_blank')
                                : toast.error("Este candidato no tiene CV registrado")
                            }
                            >
                              Ver CV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Funcionalidad en desarrollo")}>
                              Enviar mensaje
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCambiarEstado(candidato)}>
                              Cambiar estado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación */}
          {!cargando && !error && candidatos.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {paginacion.paginaActual * filtros.tamanio + 1} - {Math.min((paginacion.paginaActual + 1) * filtros.tamanio, paginacion.totalElementos)} de {paginacion.totalElementos} candidatos
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={paginacion.esPrimera}
                  onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={paginacion.esUltima}
                  onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de cambio de estado */}
      <Dialog open={modalEstadoAbierto} onOpenChange={setModalEstadoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar estado del candidato</DialogTitle>
            <DialogDescription>
              {candidatoSeleccionado && (
                <>Candidato: {candidatoSeleccionado.nombre} {candidatoSeleccionado.apellido}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Estado</Label>
              <div className="col-span-3">
                <Select onValueChange={setNuevoEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CANDIDATO.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEstadoAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={actualizarEstadoCandidato}>
              Cambiar estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
