"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrainCircuit, Sparkles, FileCode, Clock, Search, Filter, Plus, Download, Eye, MoreHorizontal, Calendar, Info, Building, AlertCircle, FileEdit, Trash2, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";

export default function PruebasTecnicasPage() {
  const router = useRouter();
  const [pruebas, setPruebas] = useState<any[]>([]);
  const [filteredPruebas, setFilteredPruebas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nivelFilter, setNivelFilter] = useState("all");
  const [vacanteFilter, setVacanteFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    const cargarUsuario = () => {
      const user = authService.getUsuario();
      if (!user || !user.id) {
        toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
        router.push("/login");
        return null;
      }
      
      return user;
    };
    
    const cargarPruebas = async () => {
      try {
        setIsLoading(true);
        const user = cargarUsuario();
        if (!user) return;
        
        setUsuario(user);
        
        if (user.rol !== "RECLUTADOR" && user.rol !== "ADMINISTRADOR") {
          toast.error("No tienes permisos para acceder a esta sección");
          router.push("/dashboard");
          return;
        }
        
        const pruebasData = await pruebaTecnicaService.obtenerPruebasPorReclutador(user.id);
        setPruebas(pruebasData);
        setFilteredPruebas(pruebasData);
      } catch (error) {
        console.error("Error al cargar pruebas técnicas:", error);
        toast.error("Error al cargar las pruebas técnicas");
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarPruebas();
  }, [router]);
  
  // Obtener vacantes únicas para el filtro
  useEffect(() => {
    if (!pruebas.length) return;
    
    // Extraer vacantes únicas de las pruebas
    const uniqueVacantes = pruebas.reduce((acc: any[], prueba: any) => {
      if (prueba.vacante && !acc.some(v => v.id === prueba.vacante.id)) {
        acc.push(prueba.vacante);
      }
      return acc;
    }, []);
    
    setVacantes(uniqueVacantes);
  }, [pruebas]);
  
  // Filtrar pruebas según búsqueda y filtros
  useEffect(() => {
    if (!pruebas.length) return;
    
    let filtered = [...pruebas];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(prueba => 
        prueba.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prueba.vacante?.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prueba.id.toString().includes(searchTerm)
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(prueba => !prueba.completada);
      } else if (statusFilter === "completed") {
        filtered = filtered.filter(prueba => prueba.completada);
      }
    }
    
    // Filtrar por nivel de dificultad
    if (nivelFilter !== "all") {
      filtered = filtered.filter(prueba => prueba.nivelDificultad === nivelFilter);
    }
    
    // Filtrar por vacante
    if (vacanteFilter !== "all") {
      if (vacanteFilter === "none") {
        filtered = filtered.filter(prueba => !prueba.vacante);
      } else if (vacanteFilter === "any") {
        filtered = filtered.filter(prueba => prueba.vacante);
      }
    }
    
    setFilteredPruebas(filtered);
  }, [searchTerm, statusFilter, nivelFilter, vacanteFilter, pruebas]);
  
  // Calcular tasa de aprobación
  const calcularTasaAprobacion = (prueba: any) => {
    if (!prueba.candidatosAsignados || prueba.candidatosAsignados === 0) return 0;
    
    const tasa = Math.round((prueba.completadas / prueba.candidatosAsignados) * 100);
    return tasa;
  };
  
  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "Fecha no disponible";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Eliminar prueba técnica
  const eliminarPrueba = async (pruebaId: number) => {
    if (!usuario || !usuario.id) {
      toast.error("No se pudo identificar al usuario");
      return;
    }
    
    if (confirm("¿Estás seguro de que deseas eliminar esta prueba técnica? Esta acción no se puede deshacer.")) {
      try {
        setIsDeleting(true);
        await pruebaTecnicaService.eliminarPruebaTecnica(pruebaId, usuario.id);
        
        // Actualizar la lista de pruebas
        const pruebasActualizadas = pruebas.filter(p => p.id !== pruebaId);
        setPruebas(pruebasActualizadas);
        setFilteredPruebas(pruebasActualizadas);
        
        toast.success("Prueba técnica eliminada con éxito");
      } catch (error) {
        console.error("Error al eliminar la prueba técnica:", error);
        toast.error("Error al eliminar la prueba técnica");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Contar filtros activos
  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (nivelFilter !== "all") count++;
    if (vacanteFilter !== "all") count++;
    
    setActiveFiltersCount(count);
  }, [searchTerm, statusFilter, nivelFilter, vacanteFilter]);

  // Renderizar esqueleto de carga
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[300px] mt-2" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[300px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pruebas Técnicas</h2>
          <p className="text-muted-foreground mt-1">Gestiona las pruebas técnicas generadas por IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reclutador/pruebas/crear">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Crear Prueba</span>
              <BrainCircuit className="h-4 w-4 text-blue-200" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-[300px]">
            <Input
              placeholder="Buscar pruebas..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={nivelFilter} onValueChange={setNivelFilter}>
            <SelectTrigger className="w-[180px] justify-between">
              <div className="flex items-center gap-2 truncate">
                {nivelFilter !== "all" && (
                  <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                )}
                <SelectValue placeholder="Nivel de dificultad" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="BASICO">Básico</SelectItem>
              <SelectItem value="INTERMEDIO">Intermedio</SelectItem>
              <SelectItem value="AVANZADO">Avanzado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={vacanteFilter} onValueChange={setVacanteFilter}>
            <SelectTrigger className="w-[230px] justify-between">
              <div className="flex items-center gap-2 truncate">
                {vacanteFilter !== "all" && (
                  <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                )}
                <SelectValue placeholder="Estado de vacante" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las vacantes</SelectItem>
              <SelectItem value="none">Sin vacante asociada</SelectItem>
              <SelectItem value="any">Con vacante asociada</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant={activeFiltersCount > 0 ? "secondary" : "outline"}
            size="icon"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setNivelFilter("all");
              setVacanteFilter("all");
            }}
            title={activeFiltersCount > 0 ? `Limpiar ${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activo${activeFiltersCount !== 1 ? 's' : ''}` : "Filtros"}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pruebas Técnicas Generadas por IA</CardTitle>
            <CardDescription>Pruebas personalizadas para evaluar candidatos</CardDescription>
          </div>
          <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" />
            <span>IA Avanzada</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todas" className="space-y-4" onValueChange={(value) => {
            // Sincronizar el valor de la pestaña con el filtro de estado
            if (value === "todas") {
              setStatusFilter("all");
            } else if (value === "activas") {
              setStatusFilter("active");
            } else if (value === "completadas") {
              setStatusFilter("completed");
            }
          }}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="activas">Activas</TabsTrigger>
              <TabsTrigger value="completadas">Completadas</TabsTrigger>
            </TabsList>
            <TabsContent value="todas" className="space-y-4">
              {filteredPruebas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPruebas.map((prueba) => (
                      <TableRow key={prueba.id}>
                        <TableCell className="font-medium">{prueba.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{prueba.titulo}</span>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{prueba.tiempoLimiteMinutos} minutos</span>
                            </div>
                          </div>
                        </TableCell>
                          <TableCell>
                            {prueba.vacante ? (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 text-muted-foreground mr-2" />
                                <Link href={`/reclutador/vacantes/${prueba.vacante.id}`} className="text-foreground hover:text-blue-600 hover:underline transition-colors">
                                  {prueba.vacante.titulo}
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center text-muted-foreground">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>No asignada</span>
                              </div>
                            )}
                          </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prueba.nivelDificultad}</Badge>
                        </TableCell>
                        <TableCell>{prueba.tiempoLimiteMinutos} min</TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatearFecha(prueba.fechaCreacion)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={prueba.completada ? "bg-green-500" : "bg-blue-500"}>
                            {prueba.completada ? "Completada" : "Activa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}`} className="flex items-center gap-2 cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                  <span>Ver detalles</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}/editar`} className="flex items-center gap-2 cursor-pointer">
                                  <FileEdit className="h-4 w-4" />
                                  <span>Editar prueba</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => eliminarPrueba(prueba.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center border rounded-lg">
                  <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No hay pruebas técnicas</h3>
                  <p className="text-muted-foreground mt-1">
                    No se encontraron pruebas técnicas. Puedes crear una nueva prueba.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/reclutador/pruebas/crear">
                      Crear Prueba Técnica
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="activas" className="space-y-4">
              {filteredPruebas.filter(p => !p.completada).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPruebas.filter(p => !p.completada).map((prueba) => (
                      <TableRow key={prueba.id}>
                        <TableCell className="font-medium">{prueba.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{prueba.titulo}</span>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{prueba.tiempoLimiteMinutos} minutos</span>
                            </div>
                          </div>
                        </TableCell>
                          <TableCell>
                            {prueba.vacante ? (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 text-muted-foreground mr-2" />
                                <Link href={`/reclutador/vacantes/${prueba.vacante.id}`} className="text-foreground hover:text-blue-600 hover:underline transition-colors">
                                  {prueba.vacante.titulo}
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center text-muted-foreground">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>No asignada</span>
                              </div>
                            )}
                          </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prueba.nivelDificultad}</Badge>
                        </TableCell>
                        <TableCell>{prueba.tiempoLimiteMinutos} min</TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatearFecha(prueba.fechaCreacion)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}`} className="flex items-center gap-2 cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                  <span>Ver detalles</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}/editar`} className="flex items-center gap-2 cursor-pointer">
                                  <FileEdit className="h-4 w-4" />
                                  <span>Editar prueba</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => eliminarPrueba(prueba.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center border rounded-lg">
                  <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No hay pruebas activas</h3>
                  <p className="text-muted-foreground mt-1">
                    No se encontraron pruebas técnicas activas.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="completadas" className="space-y-4">
              {filteredPruebas.filter(p => p.completada).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Vacante</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Fecha Finalización</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPruebas.filter(p => p.completada).map((prueba) => (
                      <TableRow key={prueba.id}>
                        <TableCell className="font-medium">{prueba.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{prueba.titulo}</span>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{prueba.tiempoLimiteMinutos} minutos</span>
                            </div>
                          </div>
                        </TableCell>
                          <TableCell>
                            {prueba.vacante ? (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 text-muted-foreground mr-2" />
                                <Link href={`/reclutador/vacantes/${prueba.vacante.id}`} className="text-foreground hover:text-blue-600 hover:underline transition-colors">
                                  {prueba.vacante.titulo}
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center text-muted-foreground">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>No asignada</span>
                              </div>
                            )}
                          </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prueba.nivelDificultad}</Badge>
                        </TableCell>
                        <TableCell>{prueba.tiempoLimiteMinutos} min</TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatearFecha(prueba.fechaFinalizacion)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}`} className="flex items-center gap-2 cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                  <span>Ver detalles</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/reclutador/pruebas/${prueba.id}/editar`} className="flex items-center gap-2 cursor-pointer">
                                  <FileEdit className="h-4 w-4" />
                                  <span>Editar prueba</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => eliminarPrueba(prueba.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center border rounded-lg">
                  <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No hay pruebas completadas</h3>
                  <p className="text-muted-foreground mt-1">
                    No se encontraron pruebas técnicas completadas.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
