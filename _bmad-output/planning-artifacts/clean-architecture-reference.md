# Clean Architecture Reference Guide

Guia de referencia para estructurar aplicaciones con Clean Architecture, MVVM, y buenas practicas de ingenieria de software. Aplicable a cualquier stack backend + frontend.

---

## Tabla de Contenidos

1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Arquitectura Backend (API)](#2-arquitectura-backend-api)
3. [Arquitectura Frontend (Panel/Dashboard)](#3-arquitectura-frontend-paneldashboard)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Patrones Transversales](#5-patrones-transversales)
6. [Checklist para Nuevos Modulos](#6-checklist-para-nuevos-modulos)

---

## 1. Principios Fundamentales

### Dependency Rule

Las dependencias apuntan **siempre hacia adentro**. La capa de dominio no conoce nada externo.

```
Infrastructure → Application → Domain
     ↑                           ↑
  Frameworks,               Cero dependencias
  bases de datos,            externas. Solo
  HTTP, UI                   logica de negocio
                              pura.
```

### Una Responsabilidad = Un Archivo

- Un enum por archivo
- Un type/interface por archivo
- Un use case por archivo
- Un controller por archivo
- Un componente por archivo

### Separacion Estricta de Capas

| Capa | Contiene | Depende de | No puede importar de |
|------|----------|------------|----------------------|
| **Domain** | Types, interfaces, enums, error codes, servicios de dominio | Nada | Application, Infrastructure |
| **Application** | Use cases (logica de negocio) | Domain | Infrastructure |
| **Infrastructure** | Controllers, repositories, DTOs, componentes UI, estado | Domain + Application | — |

---

## 2. Arquitectura Backend (API)

### 2.1 Estructura de un Modulo

```
src/modules/[feature]/
├── domain/
│   ├── enums/
│   │   ├── {feature}-status.enum.ts        # Estados del recurso
│   │   └── {feature}-events.enum.ts        # Eventos de dominio
│   ├── interfaces/
│   │   ├── {feature}-repository.interface.ts   # Contrato del repositorio
│   │   └── {service}-service.interface.ts      # Contratos de servicios externos
│   ├── types/
│   │   ├── {feature}.type.ts                   # Tipo principal de la entidad
│   │   ├── create-{feature}.type.ts            # Input para creacion
│   │   ├── update-{feature}.type.ts            # Input para actualizacion
│   │   └── {feature}-filter.type.ts            # Filtros de busqueda
│   ├── services/
│   │   └── {feature}-validation.service.ts     # Logica de validacion de dominio
│   ├── {feature}-providers.enum.ts             # Tokens de inyeccion de dependencias
│   ├── {feature}-errors.codes.ts               # Codigos de error del modulo
│   └── index.ts
│
├── application/
│   └── use-cases/
│       ├── create-{feature}.use-case.ts
│       ├── find-all-{features}.use-case.ts
│       ├── find-by-{feature}.use-case.ts
│       ├── update-{feature}.use-case.ts
│       ├── delete-{feature}.use-case.ts
│       ├── [actor]/                            # Agrupados por rol si hay multiples actores
│       │   ├── admin-create-{feature}.use-case.ts
│       │   └── partner-receive-{feature}.use-case.ts
│       └── __tests__/
│
└── infrastructure/
    ├── api/
    │   ├── [actor]/                            # Controllers agrupados por actor
    │   │   ├── create-{feature}.controller.ts
    │   │   └── find-all-{features}.controller.ts
    │   └── index.ts
    ├── dto/
    │   ├── create-{feature}.dto.ts
    │   └── update-{feature}.dto.ts
    ├── persistence/
    │   ├── {feature}.entity.ts                 # Entidad ORM
    │   └── {feature}-orm.repository.ts         # Implementacion del repositorio
    ├── presenters/
    │   └── {feature}.presenter.ts              # Transformacion de respuesta
    ├── services/
    │   └── internal-{dependency}-data.service.ts   # ACL hacia otros modulos
    ├── processors/
    │   └── {event}-on-{trigger}.processor.ts       # Procesadores de jobs asincronos
    ├── adapters/
    │   └── {feature}-event-emitter.adapter.ts      # Adaptadores de infraestructura
    └── {feature}.module.ts                         # Registro de DI
```

### 2.2 Capa de Dominio

#### Types (Entidad principal)

```typescript
// domain/types/{feature}.type.ts
export interface OrderType {
  id: number;
  customerId: number;
  status: OrderStatusEnum;
  total: number;
  createdAt: Date;

  // Relaciones opcionales (para presenters)
  customer?: CustomerType;
  items?: OrderItemType[];
}
```

#### Repository Interface (Contrato)

```typescript
// domain/interfaces/{feature}-repository.interface.ts
export interface OrderRepositoryInterface {
  findAll(options: FindAllFieldsDto<OrderFilterType>): Promise<PaginatedResourceType<OrderType>>;
  findOneBy(options: FindOneByFieldsDto<OrderFilterType>): Promise<OrderType | null>;
  store(data: CreateOrderType): Promise<OrderType>;
  update(id: number, data: UpdateOrderType): Promise<OrderType>;
  delete(id: number): Promise<void>;
}
```

#### Error Codes (Dual-Message Pattern)

Cada codigo de error tiene un mensaje para el cliente y otro para logs internos:

```typescript
// domain/{feature}-errors.codes.ts
export const orderErrorsCodes = {
  // Codigos de negocio (001-099)
  ORD001: {
    codeError: 'ORD001',
    message: 'Order not found.',                                    // Cliente ve esto
    serverMessage: 'No order matched the provided filter criteria', // Logs internos
  },
  ORD002: {
    codeError: 'ORD002',
    message: 'The order cannot be processed in its current status.',
    serverMessage: 'Order status does not meet the required conditions for this operation',
  },

  // Codigos de infraestructura (100+) — uno por operacion CRUD
  ORD100: {
    codeError: 'ORD100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query order from database',
  },
  ORD101: {
    codeError: 'ORD101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store order in database',
  },
};
```

#### Providers (Tokens de DI)

```typescript
// domain/{feature}-providers.enum.ts
export enum OrderProvidersEnum {
  ORDER_REPOSITORY = 'ORDER_REPOSITORY',
  CREATE_ORDER_USE_CASE = 'CREATE_ORDER_USE_CASE',
  FIND_ALL_ORDERS_USE_CASE = 'FIND_ALL_ORDERS_USE_CASE',
  CUSTOMER_DATA_SERVICE = 'CUSTOMER_DATA_SERVICE',
}
```

### 2.3 Capa de Aplicacion (Use Cases)

Reglas:
- **Sin try/catch externo** — las excepciones burbujean al interceptor global
- **Sin imports de framework** — logica de negocio pura
- **Todas las dependencias por constructor** — facilita testing
- **Exception service para validaciones de negocio**

```typescript
// application/use-cases/create-order.use-case.ts
export class CreateOrderUseCase {
  private readonly context = CreateOrderUseCase.name;

  constructor(
    private readonly orderRepository: OrderRepositoryInterface,
    private readonly customerDataService: CustomerDataServiceInterface,
    private readonly logger: LoggerServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: CreateOrderType, authUser: AuthenticatedUserType): Promise<OrderType> {
    // 1. Validacion de negocio (lanza excepcion si falla)
    const customer = await this.customerDataService.findById(data.customerId);
    if (!customer) {
      throw this.exception.notFoundException({
        message: orderErrorsCodes.ORD003,
        context: this.context,
      });
    }

    if (customer.status !== CustomerStatusEnum.ACTIVE) {
      throw this.exception.badRequestException({
        message: orderErrorsCodes.ORD004,
        context: this.context,
      });
    }

    // 2. Logica de negocio
    const total = this.calculateTotal(data.items);

    // 3. Persistencia (sin try/catch — el repositorio maneja errores de infra)
    const order = await this.orderRepository.store({
      ...data,
      total,
      status: OrderStatusEnum.PENDING,
    });

    // 4. Efectos secundarios
    this.logger.log({
      message: `Order ${order.id} created successfully`,
      context: this.context,
    });

    return order;
  }
}
```

### 2.4 Capa de Infraestructura

#### Controller (Adaptador HTTP)

Responsabilidades minimas: parsear request, llamar use case, retornar presenter.

```typescript
// infrastructure/api/create-order.controller.ts
@Controller()
export class CreateOrderController {
  constructor(
    @Inject(OrderProvidersEnum.CREATE_ORDER_USE_CASE)
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  @Post('api/orders')
  @Auth({ permissions: [OrderPermissions.CREATE] })
  async run(
    @AuthUser() authUser: AuthenticatedUserType,
    @Body() dto: CreateOrderDto,
    @RequestId() requestId: string,
  ): Promise<OrderPresenter> {
    // 1. Transformar DTO (wire format) → tipo de dominio
    const domainData = CaseConversionHelper.convertKeysToCamel<CreateOrderType>(dto);

    // 2. Ejecutar caso de uso — SIN try/catch
    const order = await this.createOrderUseCase.run(domainData, authUser);

    // 3. Retornar presenter (dominio → wire format)
    return new OrderPresenter(order);
  }
}
```

#### DTO (Validacion de entrada)

```typescript
// infrastructure/dto/create-order.dto.ts
export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  customer_id: number;    // snake_case en el wire format

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

#### Repository (Implementacion ORM)

Unico lugar con try/catch — convierte errores de base de datos a codigos de modulo:

```typescript
// infrastructure/persistence/order-orm.repository.ts
export class OrderOrmRepository implements OrderRepositoryInterface {
  constructor(
    private readonly repository: Repository<OrderEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async store(data: CreateOrderType): Promise<OrderEntity> {
    try {
      return await this.repository.save(data);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: orderErrorsCodes.ORD101,   // Codigo de infra, no de negocio
        context: OrderOrmRepository.name,
        error,
      });
    }
  }

  async findOneBy(filter: FindOneByFieldsDto<OrderFilterType>): Promise<OrderEntity | null> {
    try {
      const where = buildWhereClause(filter);
      return await this.repository.findOne({ where });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: orderErrorsCodes.ORD100,
        context: OrderOrmRepository.name,
        error,
      });
    }
  }
}
```

#### ACL Services (Anti-Corruption Layer)

Cuando un modulo necesita datos de otro modulo, NO importa directamente. Usa un servicio ACL que implementa una interface de dominio:

```typescript
// infrastructure/services/internal-customer-data.service.ts
export class InternalCustomerDataService implements CustomerDataServiceInterface {
  constructor(
    private readonly findByCustomerUseCase: FindByCustomerUseCase,
  ) {}

  async findById(id: number): Promise<CustomerType | null> {
    return this.findByCustomerUseCase.run({ id });
  }
}
```

Esto mantiene los modulos desacoplados: el modulo de ordenes depende de una **interface**, no del modulo de clientes directamente.

#### Module (Registro de DI)

```typescript
// infrastructure/{feature}.module.ts
@Module({
  imports: [OrmModule.forFeature([OrderEntity])],
  controllers: [CreateOrderController, FindAllOrdersController],
  providers: [
    // Repositorio
    {
      provide: OrderProvidersEnum.ORDER_REPOSITORY,
      useClass: OrderOrmRepository,
    },
    // Use cases con factory (dependencias explicitas)
    {
      inject: [
        OrderProvidersEnum.ORDER_REPOSITORY,
        OrderProvidersEnum.CUSTOMER_DATA_SERVICE,
        LoggerProvidersEnum.LOGGER_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: OrderProvidersEnum.CREATE_ORDER_USE_CASE,
      useFactory: (repo, customerService, logger, exception) =>
        new CreateOrderUseCase(repo, customerService, logger, exception),
    },
    // ACL Service
    {
      inject: [CustomerProvidersEnum.FIND_BY_CUSTOMER_USE_CASE],
      provide: OrderProvidersEnum.CUSTOMER_DATA_SERVICE,
      useFactory: (findByCustomerUseCase) =>
        new InternalCustomerDataService(findByCustomerUseCase),
    },
  ],
  exports: [OrderProvidersEnum.ORDER_REPOSITORY],
})
export class OrdersModule {}
```

### 2.5 Flujo de Request Completo (Backend)

```
HTTP Request
    │
    ▼
RequestIdMiddleware ─── Genera/propaga X-Request-ID
    │
    ▼
Rate Limiter ─────────── Throttle por IP
    │
    ▼
Auth Guard ───────────── Valida JWT + permisos
    │
    ▼
ValidationPipe ───────── Valida DTO (class-validator)
    │
    ▼
Controller ───────────── Convierte DTO → tipo de dominio
    │
    ▼
Use Case ─────────────── Logica de negocio pura
    │                     (valida, calcula, orquesta)
    ▼
Repository ───────────── Persistencia (try/catch → error codes)
    │
    ▼
Presenter ────────────── Dominio → formato de respuesta
    │
    ▼
ResponseInterceptor ──── Envuelve en { data, path, duration, requestId }
    │
    ▼
ExceptionInterceptor ─── Captura errores no manejados → 500
    │
    ▼
HTTP Response
```

### 2.6 Error Handling por Capa

| Capa | try/catch | Tipo de error | Codigo |
|------|-----------|---------------|--------|
| **Controller** | NO | — | — |
| **Use Case** | NO (lanza excepciones de negocio) | badRequest, forbidden, notFound, conflict | 001-099 |
| **Repository** | SI (captura errores de DB) | internalServerError | 100+ |
| **Interceptor Global** | SI (captura todo lo demas) | Unhandled → 500 | UNHANDLED |

### 2.7 Exception Service Interface

Contrato de dominio que abstrae las excepciones HTTP:

```typescript
export interface ExceptionServiceInterface {
  badRequestException(data): Error;      // 400 — Validacion de negocio
  unauthorizedException(data): Error;    // 401 — No autenticado
  forbiddenException(data): Error;       // 403 — Sin permisos
  notFoundException(data): Error;        // 404 — Recurso no existe
  conflictException(data): Error;        // 409 — Duplicado o conflicto de estado
  internalServerErrorException(data): Error; // 500 — Error de infraestructura
}
```

### 2.8 Interceptores Globales

Tres interceptores en cadena (de interno a externo):

1. **ExceptionInterceptor** — Captura errores no manejados, los envuelve como 500 con contexto
2. **LoggingInterceptor** — Registra entrada y salida de cada request con duracion
3. **ResponseInterceptor** — Envuelve toda respuesta exitosa en formato estandar:

```json
{
  "data": { "id": 1, "status": "pending" },
  "path": "/api/orders",
  "requestId": "abc-123",
  "duration": "45ms",
  "method": "POST"
}
```

### 2.9 Convenciones de Naming (Backend)

| Tipo | Patron de archivo | Ejemplo |
|------|-------------------|---------|
| Type | `{nombre}.type.ts` | `order.type.ts` |
| Interface | `{nombre}.interface.ts` | `order-repository.interface.ts` |
| Enum | `{nombre}.enum.ts` | `order-status.enum.ts` |
| Error Codes | `{nombre}-errors.codes.ts` | `order-errors.codes.ts` |
| Entity | `{nombre}.entity.ts` | `order.entity.ts` |
| Repository Impl | `{nombre}-orm.repository.ts` | `order-orm.repository.ts` |
| Use Case | `{accion}-{modulo}.use-case.ts` | `create-order.use-case.ts` |
| Controller | `{accion}-{modulo}.controller.ts` | `create-order.controller.ts` |
| DTO | `{accion}-{modulo}.dto.ts` | `create-order.dto.ts` |
| Presenter | `{modulo}.presenter.ts` | `order.presenter.ts` |
| Processor | `{evento}-on-{trigger}.processor.ts` | `notify-on-order-created.processor.ts` |
| ACL Service | `internal-{dep}-data.service.ts` | `internal-customer-data.service.ts` |
| Module | `{feature}.module.ts` | `orders.module.ts` |

### 2.10 Convenciones de Propiedades

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Domain/Entity | camelCase | `customerId`, `createdAt` |
| DTO (wire) | snake_case | `customer_id`, `created_at` |
| DB columns | snake_case | `customer_id`, `created_at` |
| API Response | snake_case | `customer_id`, `created_at` |

---

## 3. Arquitectura Frontend (Panel/Dashboard)

### 3.1 Estructura de un Modulo

```
src/modules/[feature]/
├── domain/
│   ├── entities/
│   │   └── {feature}.ts                      # Interface de la entidad
│   ├── repositories/
│   │   └── {feature}-repository.ts           # Interface (contrato)
│   ├── types/
│   │   ├── {feature}-pagination.ts           # Type alias para paginacion
│   │   ├── {feature}-permissions.ts          # Enum de permisos
│   │   └── {feature}-providers.type.ts       # Symbols de DI (Inversify)
│   └── index.ts
│
├── application/
│   └── use-cases/
│       ├── create-{feature}.use-case.ts
│       ├── get-all-{features}.use-case.ts
│       ├── get-{feature}-by-id.use-case.ts
│       ├── update-{feature}.use-case.ts
│       ├── delete-{feature}.use-case.ts
│       └── index.ts
│
└── infrastructure/
    ├── repositories/
    │   └── {feature}-v1.repository.ts        # Implementacion HTTP
    ├── hooks/
    │   ├── use-{features}.viewmodel.ts       # ViewModel: listado
    │   ├── use-{feature}-detail.viewmodel.ts # ViewModel: detalle
    │   ├── use-create-{feature}.viewmodel.ts # ViewModel: creacion
    │   ├── use-edit-{feature}.viewmodel.ts   # ViewModel: edicion
    │   └── use-delete-{feature}.viewmodel.ts # ViewModel: eliminacion
    ├── components/
    │   ├── {Feature}List.tsx                 # Vista: listado
    │   ├── {Feature}Detail.tsx               # Vista: detalle
    │   ├── Create{Feature}Form.tsx           # Vista: formulario creacion
    │   └── Edit{Feature}Form.tsx             # Vista: formulario edicion
    ├── state/
    │   └── {feature}.state.ts                # Zustand store
    ├── {feature}.module.ts                   # Registro de DI
    └── index.ts
```

### 3.2 Patron MVVM

```
┌─────────────────────────────────────────────────────┐
│                    VIEW (Component)                  │
│  - Solo renderizado y UI local                       │
│  - Consume ViewModel via custom hook                 │
│  - NO tiene logica de negocio                        │
└────────────────────┬────────────────────────────────┘
                     │ llama
                     ▼
┌─────────────────────────────────────────────────────┐
│               VIEWMODEL (Custom Hook)                │
│  - Orquesta use cases y estado                       │
│  - Obtiene dependencias del contenedor DI            │
│  - Maneja loading, error, paginacion                 │
│  - Retorna datos y acciones al componente            │
└────────────────────┬────────────────────────────────┘
                     │ llama
                     ▼
┌─────────────────────────────────────────────────────┐
│                 USE CASE (Clase)                      │
│  - Logica de negocio pura                            │
│  - Recibe repositorio por constructor                │
│  - No conoce React ni hooks                          │
└────────────────────┬────────────────────────────────┘
                     │ llama
                     ▼
┌─────────────────────────────────────────────────────┐
│             REPOSITORY (Implementacion)              │
│  - Traduce dominio ↔ API (camelCase ↔ snake_case)   │
│  - Usa HTTP client para comunicarse con el backend   │
│  - Mapea respuestas API a tipos de dominio           │
└─────────────────────────────────────────────────────┘
```

### 3.3 Capa de Dominio (Frontend)

#### Entidad

```typescript
// domain/entities/order.ts
export interface Order {
  id: number;
  customerId: number;
  status: string;
  total: number;
  createdAt: string;
  customer?: { id: number; name: string };
}

export interface CreateOrderData {
  customerId: number;
  items: { productId: number; quantity: number }[];
}

export interface UpdateOrderData {
  status?: string;
}
```

#### Repository Interface

```typescript
// domain/repositories/order-repository.ts
export interface OrderRepository {
  getAll(options?: GetAllOptions): Promise<PaginatedResponse<Order>>;
  getById(id: number): Promise<Order>;
  create(data: CreateOrderData): Promise<Order>;
  update(id: number, data: UpdateOrderData): Promise<Order>;
  delete(id: number): Promise<void>;
}
```

#### Providers (Symbols para DI)

```typescript
// domain/types/order-providers.type.ts
export const ORDER_PROVIDERS = {
  OrderRepository: Symbol('OrderRepository'),
  CreateOrderUseCase: Symbol('CreateOrderUseCase'),
  GetAllOrdersUseCase: Symbol('GetAllOrdersUseCase'),
  ModuleRegistered: Symbol('OrderModuleRegistered'),
};
```

### 3.4 Capa de Aplicacion (Frontend)

```typescript
// application/use-cases/create-order.use-case.ts
export class CreateOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async run(data: CreateOrderData): Promise<Order> {
    return this.repository.create(data);
  }
}
```

Los use cases en frontend suelen ser delgados (delegacion directa al repositorio). La logica compleja vive en el backend. El valor esta en mantener la **interface estable** para que cambiar la implementacion del repositorio no afecte nada mas.

### 3.5 Capa de Infraestructura (Frontend)

#### Repository Implementacion (HTTP)

```typescript
// infrastructure/repositories/order-v1.repository.ts
export class OrderV1Repository implements OrderRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getAll(options?: GetAllOptions): Promise<PaginatedResponse<Order>> {
    const params = buildQueryString(options);  // page, size, filters, sort
    const response = await this.apiClient.get<OrdersApiResponse>(`/api/orders?${params}`);
    return {
      items: response.items.map(mapOrder),     // snake_case → camelCase
      total: response.total,
      currentPage: response.current_page,
      lastPage: response.last_page,
      size: response.size,
    };
  }

  async create(data: CreateOrderData): Promise<Order> {
    const response = await this.apiClient.post<OrderApiItem>('/api/orders', {
      customer_id: data.customerId,            // camelCase → snake_case
      items: data.items.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
      })),
    });
    return mapOrder(response);
  }
}

// Mapper: API → Domain (puro, testeable)
function mapOrder(item: OrderApiItem): Order {
  return {
    id: item.id,
    customerId: item.customer_id,
    status: item.status,
    total: Number(item.total),
    createdAt: item.created_at,
  };
}
```

#### ViewModel (Custom Hook)

```typescript
// infrastructure/hooks/use-orders.viewmodel.ts
export function useOrdersViewModel() {
  // 1. Dependencias del contenedor DI
  const repository = useMemo(
    () => appContainer.get<OrderRepository>(ORDER_PROVIDERS.OrderRepository),
    [],
  );

  // 2. Estado global (Zustand)
  const { orders, pagination, setOrdersData, loading, setLoading } = useOrdersStore();

  // 3. Estado de URL (paginacion, busqueda)
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  // 4. Logica de carga
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const filters = search
        ? [{ field: 'customer_name', operator: FilterOperator.LIKE, value: search }]
        : [];
      const result = await repository.getAll({ page, size: 10, filters });
      setOrdersData(result.items, result);
    } finally {
      setLoading(false);
    }
  }, [repository, page, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // 5. Acciones para la vista
  const router = useRouter();
  const goToPage = (p: number) => router.push(`?page=${p}&search=${search}`);
  const searchOrders = (term: string) => router.push(`?page=1&search=${term}`);

  return { orders, pagination, loading, goToPage, searchOrders, refresh: loadOrders };
}
```

#### State Store (Zustand)

```typescript
// infrastructure/state/orders.state.ts
interface OrdersState {
  orders: Order[];
  pagination: PaginationInfo | null;
  selectedOrder: Order | null;

  setOrdersData: (orders: Order[], pagination: PaginationInfo) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (id: number) => void;
  setSelectedOrder: (order: Order | null) => void;
}

export const useOrdersStore = createBaseStore<OrdersState>((set) => ({
  orders: [],
  pagination: null,
  selectedOrder: null,

  setOrdersData: (orders, pagination) => set({ orders, pagination }),
  addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),
  updateOrder: (order) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === order.id ? order : o)) })),
  removeOrder: (id) =>
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));
```

#### Base Store (patron reutilizable)

Todas las stores heredan loading/error automaticamente:

```typescript
// common/store/base.store.ts
export const createBaseStore = <T extends object>(storeCreator) => {
  return create<T & BaseState>((set, get, api) => ({
    loading: false,
    error: null,
    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),
    ...storeCreator(set, get, api),
  }));
};
```

#### Componente (Vista)

```typescript
// infrastructure/components/OrdersList.tsx
export function OrdersList() {
  const { orders, loading, pagination, goToPage, searchOrders } = useOrdersViewModel();
  const { handleDelete } = useDeleteOrderViewModel();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <SearchInput onSearch={searchOrders} />

      <PermissionGate permission={OrderPermissions.CREATE}>
        <Link href="/dashboard/orders/create">New Order</Link>
      </PermissionGate>

      <table>
        <thead><tr><th>ID</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.status}</td>
              <td>${order.total}</td>
              <td>
                <PermissionGate permission={OrderPermissions.DELETE}>
                  <button onClick={() => handleDelete(order.id)}>Delete</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination currentPage={pagination?.currentPage} onPageChange={goToPage} />
    </div>
  );
}
```

#### Module (Registro DI)

```typescript
// infrastructure/orders.module.ts
export class OrdersModule {
  static register() {
    if (appContainer.isBound(ORDER_PROVIDERS.ModuleRegistered)) return;

    const apiClient = appContainer.get<ApiClient>(API_CLIENT_PROVIDERS.ApiClient);
    const repository = new OrderV1Repository(apiClient);

    appContainer.bind<OrderRepository>(ORDER_PROVIDERS.OrderRepository)
      .toConstantValue(repository);

    appContainer.bind<CreateOrderUseCase>(ORDER_PROVIDERS.CreateOrderUseCase)
      .toConstantValue(new CreateOrderUseCase(repository));

    // ... demas use cases

    appContainer.bind<boolean>(ORDER_PROVIDERS.ModuleRegistered)
      .toConstantValue(true);
  }
}
```

#### App Registry (Central)

```typescript
// src/modules/app-registry.module.ts
export class AppRegistry {
  static registerModules() {
    // 1. Infraestructura base primero
    ApiClientModule.register();

    // 2. Auth (necesario para interceptores)
    AuthModule.register();

    // 3. Modulos de dominio
    CustomersModule.register();
    OrdersModule.register();
    ProductsModule.register();
    // ...
  }
}
```

### 3.6 Autenticacion (Frontend)

#### Flujo completo:

```
1. Login (/sign-in)
   └─ ViewModel llama SignInUseCase
      └─ Repository hace POST /api/auth/sign-in
         └─ Recibe JWT → guarda en cookie (auth_token)
            └─ Decodifica JWT → actualiza auth store (user, permissions)
               └─ Redirect a /dashboard

2. Requests subsecuentes
   └─ ApiClient interceptor lee cookie auth_token
      └─ Agrega header Authorization: Bearer {token}

3. Proteccion de rutas
   └─ Middleware Next.js verifica cookie en /dashboard/*
      └─ Sin token → redirect a /sign-in
      └─ Token expirado → limpiar cookie, redirect a /sign-in
      └─ Sin permiso para la ruta → redirect a /dashboard?unauthorized=true

4. Control de UI
   └─ <PermissionGate permission="..."> oculta/muestra elementos
```

#### Auth Store

```typescript
export const useAuthStore = createBaseStore<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  permissions: [],

  setToken: (token) => {
    Cookies.set('auth_token', token, { secure: true, sameSite: 'lax' });
    const decoded = decodeJwt(token);
    set({ token, isAuthenticated: true, user: decoded.user, permissions: decoded.permissions });
  },

  logout: () => {
    Cookies.remove('auth_token');
    set({ token: null, isAuthenticated: false, user: null, permissions: [] });
  },

  hasPermission: (permission) => get().permissions.includes(permission),
}));
```

#### PermissionGate

```typescript
export function PermissionGate({ permission, anyOf, allOf, children, fallback = null }) {
  const permissions = useAuthStore((s) => s.permissions);

  let hasAccess = false;
  if (permission) hasAccess = permissions.includes(permission);
  else if (anyOf) hasAccess = anyOf.some((p) => permissions.includes(p));
  else if (allOf) hasAccess = allOf.every((p) => permissions.includes(p));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### 3.7 HTTP Client (API Client)

```typescript
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL });

    // Interceptor: inyectar JWT en cada request
    this.axiosInstance.interceptors.request.use((config) => {
      const token = Cookies.get('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Interceptor: manejar 401 globalmente
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          Cookies.remove('auth_token');
          window.location.href = '/sign-in';
        }
        throw new ApiError(error.response?.data);
      },
    );
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.get(url);
    return response.data.data;  // Desenvuelve { data, path, duration }
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await this.axiosInstance.post(url, data);
    return response.data.data;
  }
}
```

### 3.8 Organizacion de Paginas

```
src/app/
├── layout.tsx                           # Root layout + ClientInitializer (DI setup)
├── (auth)/
│   └── sign-in/page.tsx                 # Login (publico)
└── dashboard/
    ├── layout.tsx                       # Sidebar + Navbar + proteccion
    ├── page.tsx                         # Dashboard home
    └── [feature]/
        ├── page.tsx                     # Lista → <FeatureList />
        ├── create/page.tsx              # Crear → <CreateFeatureForm />
        └── [id]/
            ├── page.tsx                 # Detalle → <FeatureDetail />
            └── edit/page.tsx            # Editar → <EditFeatureForm />
```

Las paginas son minimas — solo importan el componente y lo envuelven en Suspense:

```typescript
// app/dashboard/orders/page.tsx
import { OrdersList } from '@modules/orders/infrastructure/components';

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrdersList />
    </Suspense>
  );
}
```

### 3.9 Convenciones de Naming (Frontend)

| Tipo | Patron | Ejemplo |
|------|--------|---------|
| Archivos generales | kebab-case | `order-repository.ts` |
| Componentes React | PascalCase | `OrdersList.tsx` |
| Interfaces | PascalCase (sin prefijo I) | `OrderRepository` |
| Hooks | `use{Name}` | `useOrdersStore` |
| ViewModels | `use{Name}ViewModel` | `useOrdersViewModel` |
| Use Cases | `{Action}{Feature}UseCase` | `CreateOrderUseCase` |
| Providers | `{FEATURE}_PROVIDERS` | `ORDER_PROVIDERS` |
| Module | `{Feature}Module` | `OrdersModule` |

### 3.10 Path Aliases

```typescript
// Usar aliases, nunca rutas relativas profundas
import { ApiClient } from '@common/adapters/api-client';
import { useAuthStore } from '@modules/auth/infrastructure';
import { Order } from '@modules/orders/domain';

// NUNCA
import { ApiClient } from '../../../common/adapters/api-client';
```

---

## 4. Monorepo Structure

```
project-root/
├── apps/
│   ├── api/                        # Backend API
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules (Clean Architecture)
│   │   │   ├── common/             # Shared: exception, logger, guards, helpers
│   │   │   ├── config/             # App configuration
│   │   │   ├── database/           # Migrations, seeds
│   │   │   ├── app.module.ts       # Root module
│   │   │   └── main.ts             # Bootstrap
│   │   └── test/                   # E2E tests
│   │
│   └── backoffice/                 # Frontend Dashboard
│       └── src/
│           ├── modules/            # Feature modules (Clean Architecture + MVVM)
│           ├── common/             # Shared: components, adapters, store, helpers
│           ├── app/                # Pages (App Router / File-based routing)
│           └── middleware.ts       # Auth middleware
│
├── packages/
│   ├── typescript-config/          # TSConfig compartido
│   ├── eslint-config/              # ESLint compartido
│   ├── jest-config/                # Jest compartido
│   └── ui/                         # Componentes UI compartidos (opcional)
│
└── infrastructure/
    └── docker-compose.yml          # DB, Cache, Search engine
```

### Regla critica: NO compartir tipos entre apps

Los tipos entre Backend y Frontend **no se comparten**. Cada app define sus propios tipos porque las estructuras son incompatibles:
- Backend usa camelCase en dominio, snake_case en DTOs/responses
- Frontend mapea en la capa de repositorio (API → Domain)
- Compartir tipos crea acoplamiento innecesario

---

## 5. Patrones Transversales

### 5.1 Permisos por Actor

Si hay multiples tipos de usuario (admin, partner, user), los permisos se definen por actor:

```typescript
// Backend
export enum OrderAdminPermissions { LIST = 'admin:list:orders', CREATE = 'admin:create:order' }
export enum OrderPartnerPermissions { LIST = 'partner:list:orders' }

// Frontend
export enum OrderPermissions { LIST = 'admin:list:orders', CREATE = 'admin:create:order' }
```

Los controllers se agrupan por actor:
```
infrastructure/api/
├── admin/
│   ├── admin-create-order.controller.ts
│   └── admin-find-all-orders.controller.ts
├── partner/
│   └── partner-find-all-orders.controller.ts
└── user/
    └── user-find-all-orders.controller.ts
```

### 5.2 Paginacion, Filtrado, Ordenamiento

#### Backend (genericos reutilizables)

```typescript
// Tipos genericos
type FindAllFieldsDto<T> = {
  pagination?: { page: number; size: number };
  sort?: { property: keyof T; direction: 'asc' | 'desc' };
  filters?: { property: keyof T; rule: FilterRule; value: unknown }[];
  relations?: string[];
};

type PaginatedResourceType<T> = {
  items: T[];
  total: number;
  currentPage: number;
  lastPage: number;
  size: number;
};

// Decoradores personalizados en controllers
@Get('api/orders')
async run(
  @PaginationParams() pagination: PaginationType,
  @SortingParams(['createdAt', 'total']) sort: SortingType,
  @FilteringParams(['status', 'customerId']) filters: FilteringType[],
) { ... }
```

#### Frontend (URL-driven state)

La paginacion y busqueda se manejan via query params de la URL — esto permite compartir links y usar el boton back del navegador:

```typescript
const page = parseInt(searchParams.get('page') || '1');
const search = searchParams.get('search') || '';

const goToPage = (p: number) => router.push(`?page=${p}&search=${search}`);
```

### 5.3 Event-Driven Side Effects

Para desacoplar efectos secundarios (notificaciones, jobs asinconos):

```typescript
// Use case emite evento al final
this.eventEmitter.emit<OrderCreatedEvent>({
  eventName: OrderEvents.ORDER_CREATED,
  occurredAt: new Date(),
  order,
});

// Procesador escucha y ejecuta
@Processor(OrderQueues.ORDER_EVENTS)
export class NotifyOnOrderCreatedProcessor {
  @Process(OrderEvents.ORDER_CREATED)
  async handle(job: Job<OrderCreatedEvent>) {
    await this.notificationService.send(job.data);
  }
}
```

### 5.4 Audit Trail (Logs de Estado)

Para entidades con workflows de estado, registrar cada transicion:

```typescript
await this.storeLogUseCase.run({
  entityId: order.id,
  logType: LogType.STATE_CHANGE,
  from: { status: 'pending' },
  to: { status: 'paid' },
  triggeredById: authUser.id,
  triggeredByType: 'admin',
  reason: 'Payment confirmed',
});
```

### 5.5 Versionado de Repositorios (Frontend)

Nombrar implementaciones con version (`V1Repository`) permite migrar APIs sin romper nada:

```typescript
// Hoy: OrderV1Repository usa /api/v1/orders
// Manana: OrderV2Repository usa /api/v2/orders
// El cambio es solo en el module.ts, nada mas cambia
```

---

## 6. Checklist para Nuevos Modulos

### Backend

- [ ] **Domain**: Definir tipo principal (`{feature}.type.ts`)
- [ ] **Domain**: Definir tipos de input (`create-{feature}.type.ts`, `update-{feature}.type.ts`)
- [ ] **Domain**: Definir tipo de filtro (`{feature}-filter.type.ts`)
- [ ] **Domain**: Definir interface de repositorio (`{feature}-repository.interface.ts`)
- [ ] **Domain**: Definir enums necesarios (status, providers, permissions, error codes)
- [ ] **Application**: Implementar use cases (CRUD basico + operaciones de negocio)
- [ ] **Application**: Tests unitarios de use cases
- [ ] **Infrastructure**: Crear entity ORM (`{feature}.entity.ts`)
- [ ] **Infrastructure**: Implementar repositorio (`{feature}-orm.repository.ts`)
- [ ] **Infrastructure**: Crear DTOs con validacion (`create-{feature}.dto.ts`)
- [ ] **Infrastructure**: Crear controllers por actor
- [ ] **Infrastructure**: Crear presenters si es necesario
- [ ] **Infrastructure**: Crear ACL services si depende de otros modulos
- [ ] **Infrastructure**: Registrar todo en `{feature}.module.ts`
- [ ] **Infrastructure**: Agregar modulo al `app.module.ts`
- [ ] **Database**: Crear migracion (usar API del ORM, no SQL crudo)

### Frontend

- [ ] **Domain**: Definir entidad (`{feature}.ts`)
- [ ] **Domain**: Definir interface de repositorio (`{feature}-repository.ts`)
- [ ] **Domain**: Definir providers (Symbols de DI)
- [ ] **Domain**: Definir permisos
- [ ] **Application**: Implementar use cases
- [ ] **Infrastructure**: Implementar repositorio HTTP (`{feature}-v1.repository.ts`)
- [ ] **Infrastructure**: Crear ViewModels (hooks)
- [ ] **Infrastructure**: Crear componentes (vistas)
- [ ] **Infrastructure**: Crear Zustand store
- [ ] **Infrastructure**: Registrar en modulo DI (`{feature}.module.ts`)
- [ ] **Registry**: Agregar al `AppRegistry.registerModules()`
- [ ] **Config**: Agregar path alias en `tsconfig.json`
- [ ] **Pages**: Crear paginas en `app/dashboard/[feature]/`
- [ ] **Permissions**: Agregar rutas al mapa de permisos
