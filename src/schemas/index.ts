/**
 * Schemas module exports
 */

// Common schemas
export {
  nonEmptyString,
  idSchema,
  optionalIdSchema,
  emailSchema,
  emailArraySchema,
  hexColorSchema,
  paginationSchema,
  fileSortSchema,
  folderSortSchema,
  trashSortSchema,
  shareRoleSchema,
  shareOptionsSchema,
  fileFiltersSchema,
  folderFiltersSchema,
  workspaceFiltersSchema,
  booleanCoerce,
  numberCoerce,
  parseArgs,
  safeParseArgs,
} from './common.js';

// File schemas
export {
  listFilesArgsSchema,
  getFileArgsSchema,
  uploadFileArgsSchema,
  downloadFileArgsSchema,
  generateSignedUrlArgsSchema,
  fetchFileContentArgsSchema,
  moveFileArgsSchema,
  shareFileArgsSchema,
  type ListFilesArgs,
  type GetFileArgs,
  type UploadFileArgs,
  type DownloadFileArgs,
  type GenerateSignedUrlArgs,
  type FetchFileContentArgs,
  type MoveFileArgs,
  type ShareFileArgs,
  type FileToolArgs,
} from './files.js';

// Folder schemas
export {
  listFoldersArgsSchema,
  createFolderArgsSchema,
  getFolderArgsSchema,
  updateFolderArgsSchema,
  deleteFolderArgsSchema,
  moveFolderArgsSchema,
  shareFolderArgsSchema,
  type ListFoldersArgs,
  type CreateFolderArgs,
  type GetFolderArgs,
  type UpdateFolderArgs,
  type DeleteFolderArgs,
  type MoveFolderArgs,
  type ShareFolderArgs,
  type FolderToolArgs,
} from './folders.js';

// Workspace schemas
export {
  listWorkspacesArgsSchema,
  createWorkspaceArgsSchema,
  getWorkspaceArgsSchema,
  uploadWorkspaceFileArgsSchema,
  listWorkspaceFilesArgsSchema,
  listWorkspaceFoldersArgsSchema,
  createWorkspaceFolderArgsSchema,
  getWorkspaceFolderArgsSchema,
  updateWorkspaceFolderArgsSchema,
  deleteWorkspaceFolderArgsSchema,
  type ListWorkspacesArgs,
  type CreateWorkspaceArgs,
  type GetWorkspaceArgs,
  type UploadWorkspaceFileArgs,
  type ListWorkspaceFilesArgs,
  type ListWorkspaceFoldersArgs,
  type CreateWorkspaceFolderArgs,
  type GetWorkspaceFolderArgs,
  type UpdateWorkspaceFolderArgs,
  type DeleteWorkspaceFolderArgs,
  type WorkspaceToolArgs,
} from './workspaces.js';

// Trash schemas
export {
  listTrashArgsSchema,
  restoreFromTrashArgsSchema,
  emptyTrashArgsSchema,
  type ListTrashArgs,
  type RestoreFromTrashArgs,
  type EmptyTrashArgs,
  type TrashToolArgs,
} from './trash.js';
