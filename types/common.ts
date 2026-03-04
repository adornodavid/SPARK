/* ==================================================
  Interfaces:
    - ApiResponse
    - PaginationParams
    - PaginatedResponse
    - FilterParams
    - ddlItem
    - Componentes
      - propsPageLoadingScreen
      - propsPageProcessing
      - propsPageTitlePlusNew
      - propsPageModalValidation
      - propsPageModalAlert
      - propsPageModalError
      - propsPageModalTutorial
================================================== */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FilterParams {
  search?: string
  activo?: boolean
  fechaInicio?: Date
  fechaFin?: Date
}

export interface ddlItem {
  value: string
  text: string
}

/* ==================================================
  Componentes
 ==================================================*/
export interface propsPageLoadingScreen {
  message?: string
}

export interface propsPageProcessing {
  isOpen: boolean
}

export interface propsPageTitlePlusNew {
  Titulo: string
  Subtitulo: string
  Visible: boolean
  BotonTexto: string
  Ruta: string
}

export interface propsPageModalValidation {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export interface propsPageModalAlert {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export interface propsPageModalError {
  Titulo: string
  Mensaje: string
  isOpen: boolean
  onClose: () => void
}

export interface propsPageModalTutorial {
  Titulo: string
  Subtitulo: string
  VideoUrl: string
  isOpen: boolean
  onClose: () => void
}
