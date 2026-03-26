import { Inject, Logger } from '@nestjs/common';
import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import type { WebSocket } from 'ws';
import { DocumentSyncServiceInterface, CollaborationProvidersEnum } from '../../domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { PermissionLevel, PermissionProvidersEnum } from '@modules/permissions/domain';
import { DocumentRepositoryInterface, DocumentProvidersEnum } from '@modules/documents/domain';

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string;
  documentId: string;
  permissionLevel: PermissionLevel;
}

@WebSocketGateway({ path: '/collaboration' })
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CollaborationGateway.name);
  private readonly documentClients = new Map<string, Set<AuthenticatedClient>>();
  private readonly clientMap = new Map<WebSocket, AuthenticatedClient>();
  private readonly awarenessMap = new Map<string, awarenessProtocol.Awareness>();

  constructor(
    @Inject(CollaborationProvidersEnum.DOCUMENT_SYNC_SERVICE)
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly jwtService: JwtService,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
    @Inject(DocumentProvidersEnum.DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepositoryInterface,
  ) {}

  async handleConnection(client: WebSocket, ...args: any[]): Promise<void> {
    try {
      const request = args[0] as { url?: string };
      const url = new URL(request.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      const documentId = url.searchParams.get('documentId');

      if (!token || !documentId) {
        client.close(4001, 'Missing token or documentId');
        return;
      }

      // Validate JWT
      let payload: { sub: string };
      try {
        payload = this.jwtService.verify(token);
      } catch {
        client.close(4001, 'Invalid token');
        return;
      }

      const userId = payload.sub;

      // Get document to find folderId for permission check
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        client.close(4004, 'Document not found');
        return;
      }

      // Check permission
      const permissionLevel = await this.checkPermission.run(userId, document.folderId);
      if (!permissionLevel) {
        client.close(4003, 'Insufficient permissions');
        return;
      }

      const authClient: AuthenticatedClient = {
        ws: client,
        userId,
        documentId,
        permissionLevel,
      };

      this.clientMap.set(client, authClient);

      // Add to document clients set
      if (!this.documentClients.has(documentId)) {
        this.documentClients.set(documentId, new Set());
      }
      this.documentClients.get(documentId)!.add(authClient);

      // Load Y.Doc and register connection
      const yDoc = await this.syncService.getOrLoadDocument(documentId);
      this.syncService.addConnection(documentId);

      // Check if client disconnected during async setup
      if (client.readyState !== 1) {
        this.clientMap.delete(client);
        this.documentClients.get(documentId)?.delete(authClient);
        if (this.documentClients.get(documentId)?.size === 0) {
          this.documentClients.delete(documentId);
        }
        await this.syncService.releaseDocument(documentId);
        return;
      }

      // Initialize awareness for document if not exists
      if (!this.awarenessMap.has(documentId)) {
        this.awarenessMap.set(documentId, new awarenessProtocol.Awareness(yDoc));
      }

      // Send sync step 1 to new client
      const syncEncoder = encoding.createEncoder();
      encoding.writeVarUint(syncEncoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(syncEncoder, yDoc);
      client.send(encoding.toUint8Array(syncEncoder));

      // Also send sync step 2 (full doc state) so client gets initial content
      const step2Encoder = encoding.createEncoder();
      encoding.writeVarUint(step2Encoder, MSG_SYNC);
      syncProtocol.writeSyncStep2(step2Encoder, yDoc);
      client.send(encoding.toUint8Array(step2Encoder));

      // Send current awareness state
      const awareness = this.awarenessMap.get(documentId)!;
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())),
        );
        client.send(encoding.toUint8Array(awarenessEncoder));
      }

      // Handle binary messages
      client.on('message', (data: Buffer) => {
        this.handleMessage(authClient, yDoc, new Uint8Array(data));
      });

      this.logger.log(`Client ${userId} connected to document ${documentId} (${permissionLevel})`);
    } catch (error) {
      this.logger.error('Connection error', (error as Error).stack);
      client.close(4000, 'Connection error');
    }
  }

  async handleDisconnect(client: WebSocket): Promise<void> {
    const authClient = this.clientMap.get(client);
    if (!authClient) return;

    const { documentId, userId } = authClient;

    // Remove from document clients
    const clients = this.documentClients.get(documentId);
    if (clients) {
      clients.delete(authClient);
      if (clients.size === 0) {
        this.documentClients.delete(documentId);
        this.awarenessMap.delete(documentId);
      }
    }

    this.clientMap.delete(client);

    // Release document connection
    try {
      await this.syncService.releaseDocument(documentId);
    } catch (error) {
      this.logger.error(`Failed to release document ${documentId}`, (error as Error).stack);
    }

    this.logger.log(`Client ${userId} disconnected from document ${documentId}`);
  }

  private handleMessage(authClient: AuthenticatedClient, yDoc: Y.Doc, message: Uint8Array): void {
    try {
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MSG_SYNC:
          this.handleSyncMessage(authClient, yDoc, decoder, message);
          break;
        case MSG_AWARENESS:
          this.handleAwarenessMessage(authClient, decoder);
          break;
      }
    } catch (error) {
      this.logger.error('Message handling error', (error as Error).stack);
    }
  }

  private handleSyncMessage(
    authClient: AuthenticatedClient,
    yDoc: Y.Doc,
    decoder: decoding.Decoder,
    rawMessage: Uint8Array,
  ): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);

    const syncMessageType = decoding.readVarUint(decoder);

    switch (syncMessageType) {
      case syncProtocol.messageYjsSyncStep1: {
        // Client sends its state vector, server responds with missing updates
        syncProtocol.readSyncStep1(decoder, encoder, yDoc);
        if (encoding.length(encoder) > 1) {
          authClient.ws.send(encoding.toUint8Array(encoder));
        }
        break;
      }
      case syncProtocol.messageYjsSyncStep2: {
        // Client sends missing updates to server
        if (authClient.permissionLevel !== PermissionLevel.EDIT) {
          return; // VIEW-only cannot push updates
        }
        syncProtocol.readSyncStep2(decoder, yDoc, authClient);
        break;
      }
      case syncProtocol.messageYjsUpdate: {
        // Client sends incremental update
        if (authClient.permissionLevel !== PermissionLevel.EDIT) {
          return; // VIEW-only cannot send updates
        }

        // Read the update data before applying
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(yDoc, update, authClient);

        // Persist the incremental update
        this.syncService.applyUpdate(authClient.documentId, update, authClient.userId)
          .catch((err) => this.logger.error(
            `Failed to persist update for document ${authClient.documentId}`,
            (err as Error).stack,
          ));

        // Broadcast the update to all other clients on this document
        const broadcastEncoder = encoding.createEncoder();
        encoding.writeVarUint(broadcastEncoder, MSG_SYNC);
        encoding.writeVarUint(broadcastEncoder, syncProtocol.messageYjsUpdate);
        encoding.writeVarUint8Array(broadcastEncoder, update);
        const broadcastData = encoding.toUint8Array(broadcastEncoder);

        const clients = this.documentClients.get(authClient.documentId);
        if (clients) {
          for (const other of clients) {
            if (other.ws !== authClient.ws && other.ws.readyState === 1) {
              other.ws.send(broadcastData);
            }
          }
        }
        break;
      }
    }
  }

  private handleAwarenessMessage(authClient: AuthenticatedClient, decoder: decoding.Decoder): void {
    const awareness = this.awarenessMap.get(authClient.documentId);
    if (!awareness) return;

    const update = decoding.readVarUint8Array(decoder);
    awarenessProtocol.applyAwarenessUpdate(awareness, update, authClient);

    // Broadcast awareness to all other clients on this document
    const clients = this.documentClients.get(authClient.documentId);
    if (!clients) return;

    const broadcastEncoder = encoding.createEncoder();
    encoding.writeVarUint(broadcastEncoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(broadcastEncoder, update);
    const data = encoding.toUint8Array(broadcastEncoder);

    for (const other of clients) {
      if (other.ws !== authClient.ws && other.ws.readyState === 1) {
        other.ws.send(data);
      }
    }
  }
}
