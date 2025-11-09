export interface Car {
  id: string
  name: string
  year: number
  type?: string
  seats?: number
  mpgCity?: number
  mpgHighway?: number
  msrp?: number
  drive?: string
  powertrain?: string
  image?: string
}

export interface CarsResponse {
  items: Car[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

