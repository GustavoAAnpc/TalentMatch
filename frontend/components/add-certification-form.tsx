import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Check, X } from "lucide-react"

interface AddCertificationFormProps {
  onAdd: (certification: any) => void
  onCancel: () => void
}

export function AddCertificationForm({ onAdd, onCancel }: AddCertificationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    date: "",
    expiration: ""
  })
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Certificación *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. AWS Certified Solutions Architect"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="issuer">Entidad emisora *</Label>
        <Input
          id="issuer"
          name="issuer"
          value={formData.issuer}
          onChange={handleChange}
          placeholder="Ej. Amazon Web Services"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha emisión *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
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
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </form>
  )
} 