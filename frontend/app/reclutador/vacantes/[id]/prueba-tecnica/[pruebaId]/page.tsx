"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ArrowLeft, Copy, FileCheck, FileDown, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";

export default function DetallePruebaTecnica() {
  const params = useParams();
  const router = useRouter();
  
  const vacanteId = Number(params.id);
  const pruebaId = Number(params.pruebaId);
  
  const [prueba, setPrueba] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPruebaTecnica = async () => {
      try {
        setCargando(true);
        console.log("Cargando prueba técnica con ID:", pruebaId);
        const data = await pruebaTecnicaService.obtenerPruebaPorId(pruebaId);
        console.log("Datos de prueba técnica recibidos:", data);
        setPrueba(data);
        setCargando(false);
      } catch (err) {
        console.error("Error al cargar la prueba técnica:", err);
        setError("No se pudo cargar la información de la prueba técnica");
        setCargando(false);
      }
    };

    if (pruebaId) {
      cargarPruebaTecnica();
    }
  }, [pruebaId]);

  const copiarAlPortapapeles = (texto: string) => {
    if (!texto) {
      toast.error("No hay texto para copiar");
      return;
    }
    
    navigator.clipboard.writeText(texto).then(() => {
      toast.success("Copiado al portapapeles");
    }).catch((err) => {
      console.error("Error al copiar:", err);
      toast.error("No se pudo copiar al portapapeles");
    });
  };

  // Función para exportar la prueba en formato PDF (placeholder)
  const exportarPrueba = () => {
    toast.info("Función de exportación en desarrollo");
  };

  if (cargando) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !prueba) {
    return (
      <div className="space-y-6 p-6">
        <Button asChild variant="outline">
          <Link href={`/reclutador/vacantes/${vacanteId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la vacante
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {error || "No se pudo cargar la información de la prueba técnica"}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Asegurar que las propiedades existan para evitar errores
  const titulo = prueba.titulo || "Sin título";
  const descripcion = prueba.descripcion || "Sin descripción";
  const preguntas = prueba.preguntas || [];
  const totalPreguntas = preguntas.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline">
            <Link href={`/reclutador/vacantes/${vacanteId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la vacante
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportarPrueba}>
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/reclutador/pruebas/${pruebaId}/asignar?vacanteId=${vacanteId}`}>
              <Users className="h-4 w-4 mr-2" /> Asignar a candidatos
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{titulo}</CardTitle>
              <CardDescription className="mt-2">{descripcion}</CardDescription>
            </div>
            <div className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm font-medium">{totalPreguntas} preguntas</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {!preguntas.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold">No hay preguntas en esta prueba</h3>
              <p className="text-muted-foreground mt-2 text-center">
                Esta prueba técnica no contiene preguntas. Puede regenerarla o 
                editar la prueba para agregar preguntas manualmente.
              </p>
            </div>
          ) : (
            <>
              {preguntas.map((pregunta: any, index: number) => {
                // Asegurar que la pregunta existe y tiene las propiedades necesarias
                if (!pregunta) return null;
                
                const contenido = pregunta.contenido || "Sin contenido";
                const respuestaEsperada = pregunta.respuestaEsperada;
                
                return (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">Pregunta {index + 1}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copiarAlPortapapeles(contenido)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="prose prose-gray max-w-none">
                        {contenido.split("\n").map((parrafo: string, i: number) => {
                          if (parrafo.trim() !== "") {
                            return <p key={i} className="mb-2">{parrafo}</p>;
                          }
                          return <br key={i} />;
                        })}
                      </div>
                    </div>
                    
                    {respuestaEsperada && (
                      <>
                        <h4 className="font-medium text-base">Respuesta Esperada:</h4>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-green-500">
                          <div className="prose prose-gray max-w-none">
                            {respuestaEsperada.split("\n").map((parrafo: string, i: number) => {
                              if (parrafo.trim() !== "") {
                                return <p key={i} className="mb-2">{parrafo}</p>;
                              }
                              return <br key={i} />;
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {index < preguntas.length - 1 && <Separator />}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 