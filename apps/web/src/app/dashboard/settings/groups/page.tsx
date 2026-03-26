'use client';

import { GroupForm } from '@/modules/groups/infrastructure/components/GroupForm';
import { GroupList } from '@/modules/groups/infrastructure/components/GroupList';
import { GroupMembers } from '@/modules/groups/infrastructure/components/GroupMembers';
import { useGroupViewModel } from '@/modules/groups/infrastructure/hooks/use-group.viewmodel';

export default function SettingsGroupsPage() {
  const {
    groups, selectedGroup, isLoading, error,
    createGroup, editGroup, deleteGroup,
    loadGroupDetail, addUserToGroup, removeUserFromGroup,
  } = useGroupViewModel();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium mb-4">Crear grupo</h2>
        <GroupForm
          onSubmit={createGroup}
          isLoading={isLoading}
          submitLabel="Crear grupo"
        />
        {error && !selectedGroup && (
          <div className="mt-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Grupos</h2>
        <GroupList
          groups={groups}
          onSelect={loadGroupDetail}
          onDelete={deleteGroup}
          isLoading={isLoading}
        />
      </div>

      {selectedGroup && (
        <div className="border-t border-border pt-6">
          <GroupMembers
            group={selectedGroup}
            onAddUser={addUserToGroup}
            onRemoveUser={removeUserFromGroup}
            onEditName={editGroup}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
