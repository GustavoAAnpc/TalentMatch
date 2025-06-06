"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload, Download, Trash2, File, PenLine, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { documentoService } from "@/services/documentoService"
import { authService } from "@/services/authService"

interface Documento {
  id: number
  nombre: string
  tipo: string
  descripcion?: string
  url: string
  esPrincipal: boolean
  fechaCreacion: string
  fechaActualizacion: string
}

export default function PaginaDocumentos() {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [abrirDialogo, setAbrirDialogo] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState("CURRICULUM_VITAE")
  const [descripcion, setDescripcion] = useState("")
  const [establecerPrincipal, setEstablecerPrincipal] = useState(false)
  const archivoRef = useRef<HTMLInputElement>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [usuario, setUsuario] = useState<any>(null)

  // Cargar usuario y documentos al iniciar
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioActual = authService.getUsuarioActual();
        if (usuarioActual) {
          setUsuario(usuarioActual);
          await cargarDocumentos(usuarioActual.id);
        } else {
          toast({
            title: "Error de autenticación",
            description: "Debes iniciar sesión para ver tus documentos",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarUsuario();
    
    // Agregar evento para cuando la página vuelva a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && usuario?.id) {
        cargarDocumentos(usuario.id);
      }
    };
    
    // Agregar evento para cuando se vuelva a enfocar la ventana
    const handleFocus = () => {
      if (usuario?.id) {
        cargarDocumentos(usuario.id);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Cargar documentos del candidato
  const cargarDocumentos = async (candidatoId: number) => {
    try {
      const documentosObtenidos = await documentoService.obtenerDocumentos(candidatoId);
      setDocumentos(documentosObtenidos);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus documentos",
        variant: "destructive"
      });
    }
  };

  // Manejar subida de nuevo documento
  const handleSubirDocumento = async () => {
    if (!archivoSeleccionado || !usuario?.id) {
      toast({
        title: "Error",
        description: "Selecciona un archivo para subir",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubiendo(true);
      toast({
        title: "Subiendo documento",
        description: "Por favor espera mientras se sube tu documento",
      });

      await documentoService.subirDocumento(
        usuario.id,
        archivoSeleccionado,
        tipoDocumento,
        descripcion,
        establecerPrincipal
      );

      toast({
        title: "Documento subido",
        description: "Tu documento se ha subido correctamente",
      });

      // Recargar documentos
      await cargarDocumentos(usuario.id);
      
      // Cerrar diálogo y limpiar formulario
      setAbrirDialogo(false);
      limpiarFormulario();
    } catch (error: any) {
      console.error("Error al subir documento:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive"
      });
    } finally {
      setSubiendo(false);
    }
  };

  // Manejar eliminación de documento
  const handleEliminarDocumento = async (id: number) => {
    if (!usuario?.id) return;

    try {
      await documentoService.eliminarDocumento(id, usuario.id);
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente"
      });
      await cargarDocumentos(usuario.id);
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive"
      });
    }
  };

  // Manejar establecer documento como principal
  const handleEstablecerPrincipal = async (id: number) => {
    if (!usuario?.id) return;

    try {
      await documentoService.establecerComoPrincipal(id, usuario.id);
      toast({
        title: "Documento principal",
        description: "Se ha establecido como tu currículum principal"
      });
      await cargarDocumentos(usuario.id);
    } catch (error) {
      console.error("Error al establecer documento como principal:", error);
      toast({
        title: "Error",
        description: "No se pudo establecer el documento como principal",
        variant: "destructive"
      });
    }
  };

  // Manejar descarga de documento
  const handleDescargarDocumento = async (id: number, nombre: string) => {
    try {
      setSubiendo(true); // Reutilizamos el estado de carga para la descarga
      
      // Obtener la URL firmada
      const urlData = await documentoService.obtenerUrlFirmada(id);
      
      if (!urlData || !urlData.url) {
        throw new Error("No se pudo obtener la URL del documento");
      }
      
      // Abrir en una nueva pestaña o descargar directamente
      window.open(urlData.url, '_blank');
      
      // Alternativa: Crear enlace para descargar
      /*
      const link = document.createElement('a');
      link.href = urlData.url;
      link.download = nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      */
    } catch (error) {
      console.error("Error al descargar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive"
      });
    } finally {
      setSubiendo(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setTipoDocumento("CURRICULUM_VITAE");
    setDescripcion("");
    setEstablecerPrincipal(false);
    setArchivoSeleccionado(null);
    if (archivoRef.current) {
      archivoRef.current.value = '';
    }
  };

  // Manejar cambio de archivo
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoSeleccionado(e.target.files[0]);
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Obtener icono según tipo de documento
  const getIconoDocumento = (tipo: string) => {
    switch (tipo) {
      case "CURRICULUM_VITAE":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "CERTIFICADO":
        return <FileText className="h-6 w-6 text-green-500" />;
      case "TITULO_PROFESIONAL":
        return <FileText className="h-6 w-6 text-purple-500" />;
      case "CARTA_RECOMENDACION":
        return <FileText className="h-6 w-6 text-orange-500" />;
      case "DIPLOMA":
        return <FileText className="h-6 w-6 text-yellow-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Obtener nombre para mostrar del tipo de documento
  const getNombreTipoDocumento = (tipo: string) => {
    switch (tipo) {
      case "CURRICULUM_VITAE":
        return "Currículum Vitae";
      case "CERTIFICADO":
        return "Certificado";
      case "TITULO_PROFESIONAL":
        return "Título Profesional";
      case "CARTA_RECOMENDACION":
        return "Carta de Recomendación";
      case "DIPLOMA":
        return "Diploma";
      case "OTRO":
        return "Otro";
      default:
        return tipo;
    }
  };

  // Obtener la extensión del archivo
  const getExtension = (nombre: string) => {
    const partes = nombre.split('.');
    if (partes.length > 1) {
      return partes[partes.length - 1].toUpperCase();
    }
    return "DOC";
  };

  // Obtener tamaño estimado (simulado)
  const getTamanioEstimado = (id: number) => {
    // Simulamos un tamaño aleatorio entre 500KB y 5MB
    const semilla = id % 10;
    const tamanios = ["1.2 MB", "2.4 MB", "850 KB", "3.5 MB", "745 KB", "1.8 MB", "620 KB", "4.2 MB", "950 KB", "1.5 MB"];
    return tamanios[semilla];
  };

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Mis Documentos</h1>
          <p className="text-gray-300 mt-1">Gestiona los documentos de tu perfil profesional</p>
        </div>
        <Button 
          className="bg-white text-[#0a192f] hover:bg-gray-100"
          onClick={() => setAbrirDialogo(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      <Dialog open={abrirDialogo} onOpenChange={setAbrirDialogo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Nuevo Documento</DialogTitle>
            <DialogDescription>
              Selecciona el archivo que deseas subir a tu perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
              <Select 
                value={tipoDocumento} 
                onValueChange={setTipoDocumento}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRICULUM_VITAE">Currículum Vitae</SelectItem>
                  <SelectItem value="CERTIFICADO">Certificado</SelectItem>
                  <SelectItem value="TITULO_PROFESIONAL">Título Profesional</SelectItem>
                  <SelectItem value="CARTA_RECOMENDACION">Carta de Recomendación</SelectItem>
                  <SelectItem value="DIPLOMA">Diploma</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="documento">Documento</Label>
              <Input 
                id="documento" 
                type="file" 
                ref={archivoRef}
                onChange={handleArchivoChange}
                accept=".pdf,.doc,.docx,.txt"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos permitidos: PDF, DOC, DOCX, TXT (máx. 5MB)
              </p>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea 
                id="descripcion" 
                placeholder="Añade una breve descripción del documento"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>
            {tipoDocumento === "CURRICULUM_VITAE" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="establecerPrincipal"
                  checked={establecerPrincipal}
                  onChange={(e) => setEstablecerPrincipal(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="establecerPrincipal" className="text-sm font-normal">
                  Establecer como CV principal
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAbrirDialogo(false);
                limpiarFormulario();
              }}
              disabled={subiendo}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubirDocumento}
              disabled={!archivoSeleccionado || subiendo}
            >
              {subiendo ? "Subiendo..." : "Subir Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="todos">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="cv">Currículum</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="titulos">Títulos</TabsTrigger>
          <TabsTrigger value="otros">Otros</TabsTrigger>
        </TabsList>
        
        {cargando ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-[#0a192f] border-r-transparent border-b-[#0a192f] border-l-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando tus documentos...</p>
          </div>
        ) : (
          <>
            <TabsContent value="todos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentos.length > 0 ? (
                documentos.map((doc) => (
                  <Card key={doc.id} className="overflow-hidden border-none shadow-md">
                    <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                      <div className="flex items-center space-x-3">
                        {getIconoDocumento(doc.tipo)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base text-[#0a192f] truncate">
                            {doc.nombre}
                            {doc.esPrincipal && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Principal
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            {getNombreTipoDocumento(doc.tipo)} • {getExtension(doc.nombre)} • {getTamanioEstimado(doc.id)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2 px-5 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subido el {formatearFecha(doc.fechaCreacion)}
                        </span>
                      </div>
                      {doc.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {doc.descripcion}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2 px-5">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDescargarDocumento(doc.id, doc.nombre)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                      <div className="flex space-x-1">
                        {doc.tipo === "CURRICULUM_VITAE" && !doc.esPrincipal && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEstablecerPrincipal(doc.id)}
                            title="Establecer como principal"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleEliminarDocumento(doc.id)}
                          title="Eliminar documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
                  <p className="text-muted-foreground">
                    Sube tus documentos para completar tu perfil profesional
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cv">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentos
                  .filter(doc => doc.tipo === "CURRICULUM_VITAE")
                  .map((doc) => (
                    <Card key={doc.id} className="overflow-hidden border-none shadow-md">
                      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                        <div className="flex items-center space-x-3">
                          {getIconoDocumento(doc.tipo)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base text-[#0a192f] truncate">
                              {doc.nombre}
                              {doc.esPrincipal && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Principal
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {getNombreTipoDocumento(doc.tipo)} • {getExtension(doc.nombre)} • {getTamanioEstimado(doc.id)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-5 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subido el {formatearFecha(doc.fechaCreacion)}
                          </span>
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2 px-5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDescargarDocumento(doc.id, doc.nombre)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                        <div className="flex space-x-1">
                          {!doc.esPrincipal && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEstablecerPrincipal(doc.id)}
                              title="Establecer como principal"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleEliminarDocumento(doc.id)}
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                {documentos.filter(doc => doc.tipo === "CURRICULUM_VITAE").length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No hay currículums</h3>
                    <p className="text-muted-foreground">
                      Sube tu currículum para mejorar tus oportunidades laborales
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="certificados">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentos
                  .filter(doc => doc.tipo === "CERTIFICADO" || doc.tipo === "DIPLOMA")
                  .map((doc) => (
                    <Card key={doc.id} className="overflow-hidden border-none shadow-md">
                      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                        <div className="flex items-center space-x-3">
                          {getIconoDocumento(doc.tipo)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base text-[#0a192f] truncate">{doc.nombre}</CardTitle>
                            <CardDescription>
                              {getNombreTipoDocumento(doc.tipo)} • {getExtension(doc.nombre)} • {getTamanioEstimado(doc.id)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-5 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subido el {formatearFecha(doc.fechaCreacion)}
                          </span>
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2 px-5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDescargarDocumento(doc.id, doc.nombre)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleEliminarDocumento(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                {documentos.filter(doc => doc.tipo === "CERTIFICADO" || doc.tipo === "DIPLOMA").length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No hay certificados</h3>
                    <p className="text-muted-foreground">
                      Sube tus certificados y diplomas para validar tus habilidades
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="titulos">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentos
                  .filter(doc => doc.tipo === "TITULO_PROFESIONAL")
                  .map((doc) => (
                    <Card key={doc.id} className="overflow-hidden border-none shadow-md">
                      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                        <div className="flex items-center space-x-3">
                          {getIconoDocumento(doc.tipo)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base text-[#0a192f] truncate">{doc.nombre}</CardTitle>
                            <CardDescription>
                              {getNombreTipoDocumento(doc.tipo)} • {getExtension(doc.nombre)} • {getTamanioEstimado(doc.id)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-5 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subido el {formatearFecha(doc.fechaCreacion)}
                          </span>
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2 px-5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDescargarDocumento(doc.id, doc.nombre)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleEliminarDocumento(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                {documentos.filter(doc => doc.tipo === "TITULO_PROFESIONAL").length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No hay títulos profesionales</h3>
                    <p className="text-muted-foreground">
                      Sube tus títulos profesionales para respaldar tu formación académica
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="otros">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentos
                  .filter(doc => 
                    doc.tipo !== "CURRICULUM_VITAE" && 
                    doc.tipo !== "CERTIFICADO" && 
                    doc.tipo !== "DIPLOMA" &&
                    doc.tipo !== "TITULO_PROFESIONAL"
                  )
                  .map((doc) => (
                    <Card key={doc.id} className="overflow-hidden border-none shadow-md">
                      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                        <div className="flex items-center space-x-3">
                          {getIconoDocumento(doc.tipo)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base text-[#0a192f] truncate">{doc.nombre}</CardTitle>
                            <CardDescription>
                              {getNombreTipoDocumento(doc.tipo)} • {getExtension(doc.nombre)} • {getTamanioEstimado(doc.id)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-5 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subido el {formatearFecha(doc.fechaCreacion)}
                          </span>
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.descripcion}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2 px-5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDescargarDocumento(doc.id, doc.nombre)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleEliminarDocumento(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                {documentos.filter(doc => 
                  doc.tipo !== "CURRICULUM_VITAE" && 
                  doc.tipo !== "CERTIFICADO" && 
                  doc.tipo !== "DIPLOMA" &&
                  doc.tipo !== "TITULO_PROFESIONAL"
                ).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No hay otros documentos</h3>
                    <p className="text-muted-foreground">
                      Sube otros documentos relevantes para tu perfil profesional
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
