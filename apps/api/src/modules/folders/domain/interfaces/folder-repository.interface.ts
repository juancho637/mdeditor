import { FolderType } from '../types/folder.type';

export interface FolderRepositoryInterface {
  create(data: { name: string; slug: string; parentId: string | null; createdBy: string }): Promise<FolderType>;
  findById(id: string): Promise<FolderType | null>;
  findByNameInParent(name: string, parentId: string | null): Promise<FolderType | null>;
  findAll(): Promise<FolderType[]>;
  update(id: string, data: { name: string; slug: string }): Promise<FolderType>;
  delete(id: string): Promise<void>;
  getPath(id: string): Promise<FolderType[]>;
}
