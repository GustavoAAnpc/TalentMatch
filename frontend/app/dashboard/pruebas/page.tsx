"use client";
import { useEffect, useState } from "react";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar, Clock, ClipboardList, Play, CheckCircle } from "lucide-react";

// Tipo explícito para pruebas técnicas
 type PruebaTecnica = {
   id: number;
   titulo: string;
   descripcion?: string;
   estado: string;
   fechaLimite?: string;
   duracion?: string;
   vacanteNombre?: string;
   vacanteTitulo?: string;
   puesto?: string;
   progreso?: number;
   puntuacion?: number;
   score?: number;
 };

export default function PruebasPage() {
  const [tests, setTests] = useState<PruebaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Intenta obtener el usuario desde cookie o localStorage
    let usuario = authService.getUsuario?.() || authService.getUsuarioActual?.();
    if (!usuario || !usuario.id) {
      setError("No se pudo obtener el usuario autenticado.");
      setLoading(false);
      return;
    }
    pruebaTecnicaService.obtenerPruebasPorCandidato(usuario.id)
      .then((data: PruebaTecnica[]) => setTests(data || []))
      .catch(() => setError("No se pudieron cargar las pruebas técnicas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando pruebas técnicas...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!tests.length) return <div className="p-8 text-center">No tienes pruebas técnicas asignadas.</div>;

  const getStatusProps = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return { label: "Pendiente", color: "bg-yellow-500" };
      case "EN_PROGRESO": return { label: "En progreso", color: "bg-blue-500" };
      case "COMPLETADA": return { label: "Completada", color: "bg-green-500" };
      case "EXPIRADA": return { label: "Expirada", color: "bg-red-500" };
      default: return { label: estado, color: "bg-gray-400" };
    }
  };

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Pruebas Técnicas</h1>
          <p className="text-gray-300 mt-1">Gestiona y completa las evaluaciones técnicas para tus postulaciones</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tests.map((test) => {
              const statusProps = getStatusProps(test.estado);
              return (
                <Card key={test.id} className="border-none shadow-md">
                  <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-[#0a192f]">{test.titulo}</CardTitle>
                        <CardDescription>
                          {test.vacanteNombre || test.vacanteTitulo || test.puesto || "Vacante"}
                        </CardDescription>
                      </div>
                      <Badge className={`${statusProps.color} text-white`}>{statusProps.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 px-5">
                    <p className="text-sm text-muted-foreground">{test.descripcion || "Sin descripción"}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Fecha límite: {test.fechaLimite ? new Date(test.fechaLimite).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Duración: {test.duracion || "-"}</span>
                      </div>
                    </div>
                    {test.estado === "EN_PROGRESO" && test.progreso && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progreso</span>
                          <span>{test.progreso}%</span>
                        </div>
                        <Progress value={test.progreso} className="h-2" />
                      </div>
                    )}
                    {test.estado === "COMPLETADA" && (
                      <div className="rounded-md bg-green-50 p-3">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium text-green-800">Prueba completada</p>
                            <p className="text-sm text-green-700">Puntuación: {test.puntuacion || test.score || "-"}/100</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {test.estado === "EXPIRADA" && (
                      <div className="rounded-md bg-red-50 p-3">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium text-red-800">Prueba expirada</p>
                            <p className="text-sm text-red-700">La fecha límite ha pasado</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      {(test.estado === "PENDIENTE" || test.estado === "EN_PROGRESO") && (
                        <Link href={`/dashboard/pruebas/${test.id}`}>
                          <Button className="gap-1 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a192f]">
                            {test.estado === "PENDIENTE" ? (
                              <>
                                <Play className="h-4 w-4" />
                                Iniciar prueba
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Continuar prueba
                              </>
                            )}
                          </Button>
                        </Link>
                      )}
                      {(test.estado === "COMPLETADA" || test.estado === "EXPIRADA") && (
                        <Link href={`/dashboard/pruebas/${test.id}`}>
                          <Button variant="outline" className="gap-1">
                            <ClipboardList className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tests
              .filter((test) => test.estado === "PENDIENTE" || test.estado === "EN_PROGRESO")
              .map((test) => {
                const statusProps = getStatusProps(test.estado);
                return (
                  <Card key={test.id} className="border-none shadow-md">
                    <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-[#0a192f]">{test.titulo}</CardTitle>
                          <CardDescription>
                            {test.vacanteNombre || test.vacanteTitulo || test.puesto || "Vacante"}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusProps.color} text-white`}>{statusProps.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 px-5">
                      <p className="text-sm text-muted-foreground">{test.descripcion || "Sin descripción"}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Fecha límite: {test.fechaLimite ? new Date(test.fechaLimite).toLocaleDateString() : "-"}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Duración: {test.duracion || "-"}</span>
                        </div>
                      </div>
                      {test.estado === "EN_PROGRESO" && test.progreso && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progreso</span>
                            <span>{test.progreso}%</span>
                          </div>
                          <Progress value={test.progreso} className="h-2" />
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Link href={`/dashboard/pruebas/${test.id}`}>
                          <Button className="gap-1 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a192f]">
                            {test.estado === "PENDIENTE" ? (
                              <>
                                <Play className="h-4 w-4" />
                                Iniciar prueba
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Continuar prueba
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tests
              .filter((test) => test.estado === "COMPLETADA" || test.estado === "EXPIRADA")
              .map((test) => {
                const statusProps = getStatusProps(test.estado);
                return (
                  <Card key={test.id} className="border-none shadow-md">
                    <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-[#0a192f]">{test.titulo}</CardTitle>
                          <CardDescription>
                            {test.vacanteNombre || test.vacanteTitulo || test.puesto || "Vacante"}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusProps.color} text-white`}>{statusProps.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 px-5">
                      <p className="text-sm text-muted-foreground">{test.descripcion || "Sin descripción"}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Fecha límite: {test.fechaLimite ? new Date(test.fechaLimite).toLocaleDateString() : "-"}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Duración: {test.duracion || "-"}</span>
                        </div>
                      </div>
                      {test.estado === "COMPLETADA" && (
                        <div className="rounded-md bg-green-50 p-3">
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium text-green-800">Prueba completada</p>
                              <p className="text-sm text-green-700">Puntuación: {test.puntuacion || test.score || "-"}/100</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {test.estado === "EXPIRADA" && (
                        <div className="rounded-md bg-red-50 p-3">
                          <div className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                            <div>
                              <p className="font-medium text-red-800">Prueba expirada</p>
                              <p className="text-sm text-red-700">La fecha límite ha pasado</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Link href={`/dashboard/pruebas/${test.id}`}>
                          <Button variant="outline" className="gap-1">
                            <ClipboardList className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
