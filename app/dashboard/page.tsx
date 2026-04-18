import NewUserWelcomeMsg from '@/components/new-user-welcome-msg';
import { getSession } from '@/lib/auth/helper-functions';
import { redirect } from 'next/navigation';

const Dashboard = async () => {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex-1">
      <h1>Dashboard</h1>
      {session.user.isNewUser && <NewUserWelcomeMsg />}
    </div>
  );
};

export default Dashboard;
