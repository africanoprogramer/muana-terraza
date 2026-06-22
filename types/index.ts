export interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  activa: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface ItemMenu {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: string;
  imagen: string | null;
  disponible: boolean;
  orden: number;
}

export type EstadoPedido = "pendiente" | "preparando" | "listo" | "entregado";

export interface ItemPedido {
  itemId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  nota?: string;
}

export interface Pedido {
  id: string;
  mesaId: string;
  mesaNombre: string;
  items: ItemPedido[];
  total: number;
  estado: EstadoPedido;
  numero: number;
  tiempoEstimado: number;
  notas: string;
  createdAt: number;
  updatedAt: number;
}
