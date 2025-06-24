import React from 'react';

const Dashboard = ({
  user,
  protectedData,
  statusActiveClass,
  statusInactiveClass,
  dashboardClass,
  welcomeSectionClass,
  welcomeSectionH2Class,
  userInfoClass,
  userInfoPClass,
  protectedSectionClass,
  protectedSectionH3Class,
  protectedDataClass,
  apiUserInfoClass,
  apiUserInfoH4Class,
  apiUserInfoPreClass,
  actionsSectionClass,
  actionsSectionH3Class,
  actionButtonsClass,
  actionBtnPrimaryClass,
  actionBtnSecondaryClass,
  apiClient
}) => (
  <div className={dashboardClass}>
    <div className={welcomeSectionClass}>
      <h2 className={welcomeSectionH2Class}>Welcome back, {user?.username}! 👋</h2>
      <div className={userInfoClass}>
        <p className={userInfoPClass}><strong>Email:</strong> {user?.email}</p>
        <p className={userInfoPClass}><strong>Account created:</strong> {
          user?.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : 'N/A'
        }</p>
        <p className={userInfoPClass}><strong>Status:</strong>
          <span className={user?.is_active ? statusActiveClass : statusInactiveClass}>
            {user?.is_active ? 'Active' : 'Inactive'}
          </span>
        </p>
        <p className={userInfoPClass}><strong>Email Verified:</strong>
          <span className={user?.is_verified ? statusActiveClass : statusInactiveClass}>
            {user?.is_verified ? 'Verified' : 'Not Verified'}
          </span>
        </p>
      </div>
    </div>

    {protectedData && (
      <div className={protectedSectionClass}>
        <h3 className={protectedSectionH3Class}>Protected Content</h3>
        <div className={protectedDataClass}>
          <p>{protectedData.message}</p>
          {protectedData.user && (
            <div className={apiUserInfoClass}>
              <h4 className={apiUserInfoH4Class}>API User Info:</h4>
              <pre className={apiUserInfoPreClass}>{JSON.stringify(protectedData.user, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    )}

    <div className={actionsSectionClass}>
      <h3 className={actionsSectionH3Class}>Quick Actions</h3>
      <div className={actionButtonsClass}>
        <button
          className={actionBtnPrimaryClass}
          onClick={() => window.location.reload()}
        >
          Refresh Data
        </button>
        <button
          className={actionBtnSecondaryClass}
          onClick={() => {
            apiClient.get('/api/auth/me')
              .then(() => {
                alert('Profile synced successfully!');
              })
              .catch(() => {
                alert('Failed to sync profile');
              });
          }}
        >
          Sync Profile
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard;