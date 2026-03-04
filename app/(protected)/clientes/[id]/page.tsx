import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Edit, Mail, Phone, MapPin, Calendar, Building2, FileText } from "lucide-react"
import { ClientContacts } from "@/components/admin/clients/client-contacts"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from("clients")
    .select(`
      *,
      assigned_to_user:profiles!clients_assigned_to_fkey(first_name, last_name),
      created_by_user:profiles!clients_created_by_fkey(first_name, last_name)
    `)
    .eq("id", id)
    .single()

  if (!client) {
    notFound()
  }

  const { data: contacts } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("client_id", id)
    .order("is_primary", { ascending: false })

  const { data: activities } = await supabase
    .from("client_activities")
    .select(`
      *,
      created_by_user:profiles!client_activities_created_by_fkey(first_name, last_name)
    `)
    .eq("client_id", id)
    .order("activity_date", { ascending: false })
    .limit(10)

  const { data: documents } = await supabase
    .from("client_documents")
    .select(`
      *,
      uploaded_by_user:profiles!client_documents_uploaded_by_fkey(first_name, last_name)
    `)
    .eq("client_id", id)
    .order("uploaded_at", { ascending: false })

  const clientName =
    client.type === "empresa" && client.company_name
      ? client.company_name
      : `${client.first_name || ""} ${client.last_name || ""}`.trim()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{clientName}</h1>
          <p className="text-sm text-muted-foreground">Información detallada del cliente</p>
        </div>
        <Button asChild>
          <Link href={`/clientes/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                <Badge variant={client.type === "empresa" ? "default" : "outline"}>
                  {client.type === "empresa" ? "Empresa" : "Individual"}
                </Badge>
              </div>
              {client.company_name && (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Empresa</div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {client.company_name}
                    </div>
                  </div>
                  {client.rfc && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">RFC</div>
                      <div className="font-mono">{client.rfc}</div>
                    </div>
                  )}
                </>
              )}
              {(client.first_name || client.last_name) && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {client.type === "empresa" ? "Contacto Principal" : "Nombre"}
                  </div>
                  <div>
                    {client.first_name} {client.last_name}
                  </div>
                </div>
              )}
              {client.birthday && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(client.birthday).toLocaleDateString("es-MX")}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.mobile && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.mobile}`} className="text-primary hover:underline">
                    {client.mobile} (Celular)
                  </a>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {client.address}
                    {client.city && (
                      <>
                        <br />
                        {client.city}
                        {client.state && `, ${client.state}`}
                        {client.postal_code && ` ${client.postal_code}`}
                      </>
                    )}
                    {client.country && (
                      <>
                        <br />
                        {client.country}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {client.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Notas</div>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Asignado a</div>
                <div>
                  {client.assigned_to_user
                    ? `${client.assigned_to_user.first_name} ${client.assigned_to_user.last_name}`
                    : "Sin asignar"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Creado por</div>
                <div>
                  {client.created_by_user
                    ? `${client.created_by_user.first_name} ${client.created_by_user.last_name}`
                    : "Sistema"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.preferred_contact_method && (
                <div>
                  <div className="font-medium text-muted-foreground">Contacto Preferido</div>
                  <div className="capitalize">{client.preferred_contact_method}</div>
                </div>
              )}
              {client.source && (
                <div>
                  <div className="font-medium text-muted-foreground">Fuente</div>
                  <div>{client.source}</div>
                </div>
              )}
              <div>
                <div className="font-medium text-muted-foreground">Fecha de Registro</div>
                <div>{new Date(client.created_at).toLocaleDateString("es-MX")}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividades Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {!activities || activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay actividades registradas</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 text-sm border-l-2 border-primary/20 pl-4">
                      <div className="flex-1 space-y-1">
                        <div className="font-medium capitalize">{activity.activity_type}</div>
                        {activity.description && <p className="text-muted-foreground">{activity.description}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(activity.activity_date).toLocaleString("es-MX")}</span>
                          {activity.created_by_user && (
                            <>
                              <span>•</span>
                              <span>
                                {activity.created_by_user.first_name} {activity.created_by_user.last_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contacts" className="space-y-4">
          <ClientContacts clientId={id} initialContacts={contacts || []} />
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay documentos cargados</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.document_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {doc.document_type && <span className="capitalize">{doc.document_type} • </span>}
                            {new Date(doc.uploaded_at).toLocaleDateString("es-MX")}
                          </div>
                        </div>
                      </div>
                      {doc.file_url && (
                        <Button asChild variant="outline" size="sm">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            Ver
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
