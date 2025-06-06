import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Award, X, Check } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalForm } from "./modal-form"
import { ConfirmDialog } from "./confirm-dialog"

interface CertificationItemProps {
  certification: {
    id: number
    name: string
    issuer: string
    date: string
    expiration: string
  }
  onEdit: (id: number, updatedCertification: any) => void
  onDelete: (id: number) => void
}

export function CertificationItem({ certification, onEdit, onDelete }: CertificationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formData, setFormData] = useState(certification)
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Guardar los cambios
  const handleSave = () => {
    onEdit(certification.id, formData)
    setIsEditing(false)
  }
  
  // Cancelar edición
  const handleCancel = () => {
    setFormData(certification)
    setIsEditing(false)
  }
  
  // Confirmar eliminación
  const handleDelete = () => {
    setIsConfirmingDelete(true)
  }
  
  const confirmDelete = () => {
    onDelete(certification.id)
  }
  
  // Formulario de edición
  const editForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Certificación</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. AWS Certified Solutions Architect"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="issuer">Entidad emisora</Label>
        <Input
          id="issuer"
          name="issuer"
          value={formData.issuer}
          onChange={handleChange}
          placeholder="Ej. Amazon Web Services"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha emisión</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expiration">Fecha vencimiento</Label>
          <Input
            id="expiration"
            name="expiration"
            type="date"
            value={formData.expiration}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </div>
  )
  
  // Vista normal
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#38bdf8]/10 p-2 text-[#38bdf8]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-[#0a192f]">{certification.name}</h3>
              <p className="text-sm text-muted-foreground">
                {certification.issuer}
              </p>
              <p className="text-sm text-muted-foreground">
                {certification.date} {certification.expiration && `- Vence: ${certification.expiration}`}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal de edición */}
      <ModalForm
        title="Editar certificación"
        description="Actualiza los detalles de tu certificación"
        isOpen={isEditing}
        onClose={handleCancel}
      >
        {editForm}
      </ModalForm>
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar certificación"
        description="¿Estás seguro de que deseas eliminar esta certificación? Esta acción no se puede deshacer."
      />
    </>
  )
}
