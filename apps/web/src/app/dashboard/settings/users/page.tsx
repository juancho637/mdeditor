'use client';

import { InviteUserForm } from '@/modules/invitations/infrastructure/components/InviteUserForm';
import { InvitationList } from '@/modules/invitations/infrastructure/components/InvitationList';
import { useInvitationViewModel } from '@/modules/invitations/infrastructure/hooks/use-invitation.viewmodel';

export default function SettingsUsersPage() {
  const { invitations, isLoading, error, createInvitation } = useInvitationViewModel();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium mb-4">Invitar usuarios</h2>
        <InviteUserForm
          onInvite={async (email) => {
            const result = await createInvitation(email);
            return result ? { invitationLink: result.invitationLink } : null;
          }}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <div>
        <InvitationList invitations={invitations} />
      </div>
    </div>
  );
}
